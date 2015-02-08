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
     * @param {Object} model The file model (this is modified by the function).
     * @return {Object} the converted file model
     */
    var to_virtual_model = function(root, model) {
        model['path'] = to_virtual_path(root, model['path']);
        return model;
    };

    /**
     * Takes a file list, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {Object} model The file list (this is modified by the function).
     * @return {Object} The converted file list
     */
    var to_virtual_list = function(root, list) {
        list['content'].forEach($.proxy(to_virtual_model, this, root));
        return list;
    };

    /**
     * Route a function to the appropriate content manager class
     * @param {string} method_name Name of the method being called
     * @param {Array} path_args the indices of the arguments which are paths
     * @param {Array} args the arguments to apply
     * @param {Function} drive_continuation Function to apply to arguments when Google Drive is selected.
     */
    Contents.prototype.route_function = function(method_name, path_args, args, drive_continuation) {
        if (path_args.length == 0) {
            // Unexpected error: if path_args is empty then there is no way to
            // route this function, since there is no way to tell which
            // Contents instance to use.
            throw 'path_args was empty, so route_function cannot determine which Contents instance to use';
        }
        var root = this.get_fs_root(args[path_args[0]]);
        for (var i = 0; i < path_args.length; i++) {
            var idx = path_args[i];
            args[idx] = from_virtual_path(root, args[idx]);
        }
        var contents = this.filesystem[root];
        return contents[method_name].apply(contents, args).then(
            $.proxy(drive_continuation, this, root));
    };

    /**
     * File management functions
     */

    Contents.prototype.get = function (path, type, options) {
        return this.route_function('get', [0], arguments, to_virtual_model);
    };

    Contents.prototype.new_untitled = function(path, options) {
        return this.route_function('new_untitled', [0], arguments, to_virtual_model);
    };

    Contents.prototype.delete = function(path) {
        return this.route_function('delete', [0], arguments, function(x) {return x;});
    };

    Contents.prototype.rename = function(path, new_path) {
        return this.route_function('rename', [0, 1], arguments, to_virtual_model);
    };

    Contents.prototype.save = function(path, model, options) {
        return this.route_function('save', [0], arguments, to_virtual_model);
    };

    Contents.prototype.list_contents = function(path, options) {
        var that = this;
        return this.route_function('list_contents', [0], arguments, to_virtual_list)
        .then(function(response) {
            if (path === '') {
                // If this is the root path, add the drive mountpoint directory.
                response['content'] = response['content'].concat(that.virtual_fs_roots());
            }
            return response;
        });
    };

    Contents.prototype.copy = function(from_file, to_dir) {
        return this.route_function('copy', [0, 1], arguments);
    };

    /**
     * Checkpointing Functions
     */

    Contents.prototype.create_checkpoint = function(path, options) {
        return this.route_function('create_checkpoint', [0], arguments);
    };

    Contents.prototype.restore_checkpoint = function(path, checkpoint_id, options) {
        return this.route_function('restore_checkpoint', [0], arguments);
    };

    Contents.prototype.list_checkpoints = function(path, options) {
        return this.route_function('list_checkpoints', [0], arguments);
    };

    IPython.Contents = Contents;

    return {'Contents': Contents};
});