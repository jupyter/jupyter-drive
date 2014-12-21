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
        this.local_contents = new local_contents.Contents(options);
        this.drive_contents = new drive_contents.Contents(options);
    };

    /** @type {string} Sentinel for path in Google Drive */
    var DRIVE_PATH_SENTINEL = 'gdrive';

    /**
     * Generates the object that represents the Google Drive filesystem
     * @return {Object} An object representing the Google Drive directory
     */
    var drive_path_mountpoint = function() {
        return {
            type: 'directory',
            name: DRIVE_PATH_SENTINEL,
            path: DRIVE_PATH_SENTINEL,
        };
    };

    /**
     * Routing functions
     */

    /**
     * Determine if a path belongs to Google Drive
     * @param {string} path The path to check.
     * @return {boolean} True if the path is a Google Drive path.
     *
     */
    var is_drive_path = function(path) {
        var components = path.split('/');
        return components.length > 0 && components[0] === DRIVE_PATH_SENTINEL;
    }

    /**
     * Convert a path from notebook to Google Drive format
     * @param {string} path The path to convert.
     * @return {string} the converted path (gdrive/my/directory => my_directory)
     *
     */
    var notebook_path_to_drive_path = function(path) {
        var components = path.split('/');
        return components.slice(1).join('/');
    }

    /**
     * Convert a path from Google Drive to notebook format
     * @param {string} path The path to convert.
     * @return {string} the converted path (gdrive/my/directory => my_directory)
     *
     */
    var drive_path_to_notebook_path = function(path) {
        var components = path.split('/');
        return [DRIVE_PATH_SENTINEL].concat(components).join('/');
    }

    /**
     * Takes a files resource (an object with a 'path' key) and converts it
     * from Google Drive format
     * @param {Object} obj The files object (this is modified by the function).
     */
    var convert_response = function(obj) {
        console.log(obj);
        obj['path'] = drive_path_to_notebook_path(obj['path']);
        return obj;
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
        if (is_drive_path(args[path_args[0]])) {
            for (var i = 0; i < path_args.length; i++) {
                var idx = path_args[i];
                args[idx] = notebook_path_to_drive_path(args[idx]);    
            }
            return this.drive_contents[method_name].apply(this.drive_contents, args).then(drive_continuation);
        } else {
            return this.local_contents[method_name].apply(this.local_contents, args);
        }
    }

    /**
     * File management functions
     */

    Contents.prototype.get = function (path, type, options) {
        return this.route_function('get', [0], arguments, convert_response);
    };

    Contents.prototype.new_untitled = function(path, options) {
        return this.route_function('new_untitled', [0], arguments, convert_response);
    };

    Contents.prototype.delete = function(path) {
        return this.route_function('delete', [0], arguments, function(x) {return x;});
    };

    Contents.prototype.rename = function(path, new_path) {
        return this.route_function('rename', [0, 1], arguments, convert_response);
    };

    Contents.prototype.save = function(path, model, options) {
        return this.route_function('save', [0], arguments, convert_response);
    };

    Contents.prototype.list_contents = function(path, options) {
        return this.route_function('list_contents', [0], arguments, function(response) {
            response['content'].forEach(convert_response);
            return response;
        }).then(function(response) {
            if (path === '') {
                // If this is the root path, add the drive mountpoint directory.
                response['content'].push(drive_path_mountpoint());
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