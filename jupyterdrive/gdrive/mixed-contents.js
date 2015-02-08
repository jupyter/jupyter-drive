// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
define(function(require) {
    "use strict";

    var IPython = require('base/js/namespace');
    var $ = require('jquery');
    var utils = require('base/js/utils');
    var dialog = require('base/js/dialog');
    var gapi_utils = require('./gapi_utils');
    var drive_utils = require('./drive_utils');
    var drive_contents = require('./drive-contents');
    var local_contents = require('services/contents');
    var notebook_model = require('./notebook_model');

    /** @type {Array} Array of objects with keys 'root' and 'contents' */
    // TODO: make this configurable
    var filesystem_scheme = [
        {
            'root': '',
            'contents': local_contents
        },
        {
            'root': 'gdrive',
            'contents': drive_contents
        }
    ];

    var Contents = function(options) {
        // Constructor
        //
        // A contentmanager handles passing file operations
        // to the back-end.  This includes checkpointing
        // with the normal file operations.
        //
        // Parameters:
        //  options: dictionary
        //      Dictionary of keyword arguments.
        //          base_url: string

        // Generate a map from root directories, to Contents instances.
        this.filesystem = {};
        filesystem_scheme.forEach(function(fs) {
            this.filesystem[fs['root']] = new fs['contents'].Contents(options);
        }, this);
    };

    /**
     * Generates the object that represents a filesystem
     * @return {Object} An object representing a virtual directory.
     */
    Contents.prototype.virtual_fs_roots = function() {
        return Object.keys(this.filesystem).map(function(root) {
            return {
                type: 'directory',
                name: root,
                path: root,
            };
        });
    };

    /**
     * Routing functions
     */

    /**
     * Determine which Contents instance to use.
     * @param {String} path The path to check.
     * @return {String} The root path for the contents instance.
     */
    Contents.prototype.get_fs_root = function(path) {
        var components = path.split('/');
        if (components.length == 0) {
            return '';
        }
        if (this.filesystem[components[0]]) {
            return components[0];
        }
        return '';
    };

    /**
     * Convert a path from the virtual filesystem used by the front end, to the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    var from_virtual_path = function(root, path) {
        return path.substr(root.length);
    };

    /**
     * Convert a path to the virtual filesystem used by the front end, from the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    var to_virtual_path = function(root, path) {
        return utils.url_path_join(root, path);
    };

    /**
     * Takes a file model, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {Object} file The file model (this is modified by the function).
     * @return {Object} the converted file model
     */
    var to_virtual_file = function(root, file) {
        file['path'] = to_virtual_path(root, file['path']);
        return file;
    };

    /**
     * Takes a file list, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {Object} list The file list (this is modified by the function).
     * @return {Object} The converted file list
     */
    var to_virtual_list = function(root, list) {
        list['content'].forEach($.proxy(to_virtual_file, this, root));
        return list;
    };

    /** Enum for object types */
    var ArgType = {
        PATH : 1,
        FILE : 2,
        LIST : 3,
        OTHER : 4
    };

    var to_virtual = function(root, type, object) {
        if (type === ArgType.PATH) {
            return to_virtual_path(root, object);
        } else if (type === ArgType.FILE) {
            return to_virtual_file(root, object);
        } else if (type === ArgType.LIST) {
            return to_virtual_list(root, object);
        } else {
            return object;
        }
    };

    var from_virtual = function(root, type, object) {
        if (type === ArgType.PATH) {
            return from_virtual_path(root, object);
        } else if (type === ArgType.FILE) {
            throw "from_virtual_file not implemented";
        } else if (type === ArgType.LIST) {
            throw "from_virtual_list not implemented";
        } else {
            return object;
        }
    };

    /**
     * Route a function to the appropriate content manager class
     * @param {string} method_name Name of the method being called
     * @param {Array} arg_types Types of the arguments to the function
     * @param {Array} arg_types Type of the return value of the function
     * @param {Array} args the arguments to apply
     */
    Contents.prototype.route_function = function(method_name, arg_types, return_type, args) {
        if (arg_types.length == 0 || arg_types[0] != ArgType.PATH) {
            // This should never happen since arg_types is hard coded below.
            throw 'unexpected value of arg_types';
        }
        var root = this.get_fs_root(args[0]);

        for (var i = 0; i < args.length; i++) {
            args[i] = from_virtual(root, arg_types[i], args[i]);
        }
        var contents = this.filesystem[root];
        return contents[method_name].apply(contents, args).then(
            $.proxy(to_virtual, this, root, return_type));
    };

    /**
     * File management functions
     */

    Contents.prototype.get = function (path, type, options) {
        return this.route_function(
            'get',
            [ArgType.PATH, ArgType.OTHER, ArgType.OTHER],
            ArgType.FILE, arguments);
    };

    Contents.prototype.new_untitled = function(path, options) {
        return this.route_function(
            'new_untitled',
            [ArgType.PATH, ArgType.OTHER],
            ArgType.FILE, arguments);
    };

    Contents.prototype.delete = function(path) {
        return this.route_function(
            'delete',
            [ArgType.PATH],
            ArgType.FILE, arguments);
    };

    Contents.prototype.rename = function(path, new_path) {
        return this.route_function(
            'rename',
            [ArgType.PATH, ArgType.PATH],
            ArgType.FILE, arguments);
    };

    Contents.prototype.save = function(path, model, options) {
        return this.route_function(
            'save',
            [ArgType.PATH, ArgType.OTHER, ArgType.OTHER],
            ArgType.FILE, arguments);
    };

    Contents.prototype.list_contents = function(path, options) {
        var that = this;
        return this.route_function(
            'list_contents',
            [ArgType.PATH, ArgType.OTHER],
            ArgType.LIST, arguments)
        .then(function(response) {
            if (path === '') {
                // If this is the root path, add the drive mountpoint directory.
                response['content'] = response['content'].concat(that.virtual_fs_roots());
            }
            return response;
        });
    };

    Contents.prototype.copy = function(from_file, to_dir) {
        return this.route_function(
            'copy',
            [ArgType.PATH, ArgType.PATH],
            ArgType.FILE, arguments);
    };

    /**
     * Checkpointing Functions
     */

    Contents.prototype.create_checkpoint = function(path, options) {
        return this.route_function(
            'create_checkpoint',
            [ArgType.PATH, ArgType.OTHER],
            ArgType.OTHER, arguments);
    };

    Contents.prototype.restore_checkpoint = function(path, checkpoint_id, options) {
        return this.route_function(
            'restore_checkpoint',
            [ArgType.PATH, ArgType.OTHER, ArgType.OTHER],
            ArgType.OTHER, arguments);
    };

    Contents.prototype.list_checkpoints = function(path, options) {
        return this.route_function(
            'list_checkpoints',
            [ArgType.PATH, ArgType.OTHER],
            ArgType.OTHER, arguments);
    };

    IPython.Contents = Contents;

    return {'Contents': Contents};
});