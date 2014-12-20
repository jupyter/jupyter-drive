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
     * Routing functions
     */

    /**
     * Determine if a path belongs to Google Drive
     * @param {string} path The path to check.
     * @return {boolean} True if the path is a Google Drive path.
     *
     */
    Contents.prototype.is_drive_path = function(path) {
        var components = path.split('/');
        return components.length > 0 && components[0] === DRIVE_PATH_SENTINEL;
    }

    /**
     * Convert a path from notebook to Google Drive format
     * @param {string} path The path to convert.
     * @return {string} the converted path (gdrive/my/directory => my_directory)
     *
     */
    Contents.prototype.notebook_path_to_drive_path = function(path) {
        var components = path.split('/');
        return components.slice(1).join('/');
    }

    /**
     * Route a function to the appropriate content manager class
     * @param {string} method_name Name of the method being called
     */
    Contents.prototype.route_function = function(method_name, args) {
        if (this.is_drive_path(args[0])) {
            var new_args = Array.prototype.slice(args);
            new_args[0] = this.notebook_path_to_drive_path(args[0]);
            return this.drive_contents[method_name].apply(this.drive_contents, new_args);
        } else {
            return this.local_contents[method_name].apply(this.local_contents, args);
        }
    }

    /**
     * File management functions
     */

    Contents.prototype.get = function (path, type, options) {
        return this.route_function('get', arguments);
    };

    Contents.prototype.new_untitled = function(path, options) {
        return this.route_function('new_untitled', arguments);
    };

    Contents.prototype.delete = function(path) {
        return this.route_function('delete', arguments);
    };

    Contents.prototype.rename = function(path, new_path) {
        return this.route_function('rename', arguments);
    };

    Contents.prototype.save = function(path, model, options) {
        return this.route_function('save', arguments);
    };

    Contents.prototype.list_contents = function(path, options) {
        return this.route_function('list_contents', arguments);
    };

    Contents.prototype.copy = function(from_file, to_dir) {
        return this.route_function('copy', arguments);
    };

    /**
     * Checkpointing Functions
     */

    Contents.prototype.create_checkpoint = function(path, options) {
        return this.route_function('create_checkpoint', arguments);
    };

    Contents.prototype.restore_checkpoint = function(path, checkpoint_id, options) {
        return this.route_function('restore_checkpoint', arguments);
    };

    Contents.prototype.list_checkpoints = function(path, options) {
        return this.route_function('list_checkpoints', arguments);
    };

    IPython.Contents = Contents;

    return {'Contents': Contents};
});