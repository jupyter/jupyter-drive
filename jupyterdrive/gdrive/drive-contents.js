// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
define(function(require) {
    "use strict";

    var $ = require('jquery');
    var utils = require('base/js/utils');
    var dialog = require('base/js/dialog');
    var gapi_utils = require('./gapi_utils');
    var drive_utils = require('./drive_utils');
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
        this.base_url = options.base_url;
        this.config  = options.common_config;
        /**
         * Stores the revision id from the last save or load.  This is used
         * when checking if a file has been modified by another user.
         */
        this.last_observed_revision = {};
        var that = this;
        this.config.loaded.then(function(data){
          gapi_utils.config(that.config);
          gapi_utils.gapi_ready.then(drive_utils.set_user_info);
        })

    };

    /**
     * Utility functions
     */

    /**
     * This function should be called when a file is modified or opened.  It
     * caches the revisionId of the head revision of that file.  This
     * information is used for two purposes.  First, it is used to determine
     * if another user has changed a file, in order to warn a user that they
     * may be overwriting another user's work.  Second, it is used to
     * checkpoint after saving.
     *
     * @param {resource} resource_prm a Google Drive file resource.
     */
    Contents.prototype.observe_file_resource = function(resource) {
        this.last_observed_revision[resource['id']] = resource['headRevisionId'];
    };

    /**
     * Converts a Google Drive files resource, (see
     * https://developers.google.com/drive/v2/reference/files)
     * to an IPEP 27 contents model (see
     * https://github.com/ipython/ipython/wiki/IPEP-27:-Contents-Service)
     * Note that files resources can represent files or directories.
     *
     * TODO: check that date formats are the same, and either
     * convert to the IPython format, or document the difference.
     *
     * @param {string} path Path of resoure (including file name)
     * @param {Object} resource Google Drive files resource
     * @return {Object} IPEP 27 compliant contents model
     */
    var files_resource_to_contents_model = function(path, resource, content) {
        var title = resource['title'];
        var mimetype = resource['mimeType'];

        // Determine resource type.
        var nbextension = '.ipynb';
        var type = 'file';
        var model_content;
        if (mimetype === drive_utils.FOLDER_MIME_TYPE) {
            type = 'directory';
        } else if (mimetype === drive_utils.NOTEBOOK_MIMETYPE ||
            title.indexOf(nbextension, title.length - nbextension.length) !== -1) {
            type = 'notebook';
            if( typeof content !== 'undefined'){
                model_content = notebook_model.notebook_from_file_contents(content);
            }
        } else {
            if( typeof content !== 'undefined'){
                model_content = content;
            }
        }
        return {
            type: type,
            name: title,
            path: path,
            created: resource['createdDate'],
            last_modified: resource['modifiedDate'],
            content : model_content,
            writable : resource['editable']
        };
    };

    /**
     * Takes a contents model and converts it into metadata and bytes for
     * Google Drive upload.
     */
    var contents_model_to_metadata_and_bytes = function(model) {
        var content = model.content;
        var mimetype = model.mimetype;
        var format = model.format;
        if (model['type'] === 'notebook') {
            content = notebook_model.file_contents_from_notebook(content);
            format = 'json';
            mimetype = drive_utils.NOTEBOOK_MIMETYPE;
        } else if (model['type'] === 'file') {
            format = format || 'text/plain';
        } else if (model['type'] === 'directory') {
            format = 'json'
            mimetype = drive_utils.FOLDER_MIME_TYPE;
        } else {
            throw ("Unrecognized type " + model['type']);
        }

        // Set mimetype according to format if it's not set
        if (format == 'json') {
            content = JSON.stringify(content);
            mimetype = mimetype || 'application/json';
        } else if (format == 'base64') {
            mimetype = mimetype || 'application/octet-stream';
        } else if (format == 'text') {
            mimetype = mimetype || 'text/plain';
        } else {
            throw ("Unrecognized format " + format)
        }

        var metadata = {
            'title' : model['name'],
            'mimeType' : mimetype
        };

        return [metadata, content];
    }

    /**
     * Saves a version of an existing file on drive
     * @param {Object} resource The Drive resource representing the file
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    Contents.prototype.save_existing = function(resource, model) {
        var that = this;
        var converted = contents_model_to_metadata_and_bytes(model);
        var contents = converted[1];
        var save = function() {
            return drive_utils.upload_to_drive(contents, undefined, resource['id']);
        };
        if (resource['headRevisionId'] !=
            that.last_observed_revision[resource['id']]) {
            // The revision id of the files resource does not match the
            // cached revision id for this file.  This implies that the
            // file has been modified by another user/tab during this
            // session.  Before saving, the user must be warned that they
            // may be overwriting the work of another user.
            return new Promise(function(resolve, reject) {
                var options = {
                    title: 'File modified by other user',
                    body: ('Another user has modified this file.  Click'
                           + ' ok to overwrite this file with your'
                           + ' content.'),
                    buttons: {
                        'ok': { click : function() { resolve(save()); },
                              },
                        'cancel': { click : function() { reject(new Error('save cancelled')); } }
                    }
                };
                dialog.modal(options);
            });
        }
        return save();
    }

    /**
     * Uploads a model to drive
     * @param {string} folder_id The id of the folder to create the file in
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    Contents.prototype.upload_new = function(folder_id, model) {
        var that = this;

        var converted = contents_model_to_metadata_and_bytes(model);
        var metadata = converted[0];
        var contents = converted[1];
        metadata['parents'] = [{'id' : folder_id}];

        if (model['type'] === 'directory') {
            return gapi_utils.execute(gapi.client.drive.files.insert({'resource': metadata}));
        } else {
            return drive_utils.upload_to_drive(contents, metadata);
        }
    }

    /**
     * Notebook Functions
     */

    /**
     * Load a notebook.
     *
     * Calls success_callback with notebook JSON object (as string), or
     * options.error with error.
     *
     * @method load_notebook
     * @param {String} path
     * @param {String} name
     * @param {Object} options
     */
    Contents.prototype.get = function (path, options) {
        var that = this;
        var metadata_prm = gapi_utils.gapi_ready.then(
            $.proxy(drive_utils.get_resource_for_path, this, path, drive_utils.FileType.FILE));
        var contents_prm = metadata_prm.then(function(resource) {
            that.observe_file_resource(resource);
            return drive_utils.get_contents(resource, false);
        });

        return Promise.all([metadata_prm, contents_prm]).then(function(values) {
            var metadata = values[0];
            var contents = values[1];
            var model = files_resource_to_contents_model(path, metadata, contents);
            return model;
        });
    };


    /**
     * Creates a new untitled file or directory in the specified directory path.
     *
     * @method new
     * @param {String} path: the directory in which to create the new file/directory
     * @param {Object} options:
     *      ext: file extension to use
     *      type: model type to create ('notebook', 'file', or 'directory')
     */
    Contents.prototype.new_untitled = function(path, options) {
        // Construct all data needed to upload file
        var default_ext = '';
        var base_name = '';
        var model = null;
        if (options['type'] === 'notebook') {
            default_ext = '.ipynb';
            base_name = 'Untitled'
            model = {
                'type': 'notebook',
                'content': notebook_model.new_notebook(),
                'mimetype': drive_utils.NOTEBOOK_MIMETYPE,
                'format': 'json'
            };
        } else if (options['type'] === 'file') {
            default_ext = '.txt';
            base_name = 'Untitled';
            model = {
                'type': 'file',
                'content': '',
                'mimetype': 'text/plain',
                'format': 'text'
            };
        } else if (options['type'] === 'directory') {
            base_name = 'Untitled_Folder';
            model = {
                'type': 'directory',
                'content': {},
                'format' : 'json'
            }
        } else {
            return Promise.reject(new Error("Unrecognized type " + options['type']));
        }

        var that = this;
        var folder_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.Folder))
        var filename_prm = folder_id_prm.then(function(resource){
            return drive_utils.get_new_filename(resource, options['ext'] || default_ext, base_name);
        });
        return Promise.all([folder_id_prm, filename_prm]).then(function(values) {
            var folder_id = values[0];
            var filename = values[1];
            model['name'] = filename;
            return that.upload_new(folder_id, model);
        })
        .then(function(resource) {
            var fullpath = utils.url_path_join(path, resource['title']);
            return files_resource_to_contents_model(fullpath, resource);
        });
    };

    Contents.prototype.delete = function(path) {
        return gapi_utils.gapi_ready
        .then(function() {
            return drive_utils.get_id_for_path(path, drive_utils.FileType.FILE);
        })
        .then(function(file_id){
            return gapi_utils.execute(gapi.client.drive.files.delete({'fileId': file_id}));
        });
    };

    Contents.prototype.rename = function(path, new_path) {
        var that = this;
        // Rename is only possible when path and new_path differ except in
        // their last component, so check this first.
        var path_components = drive_utils.split_path(path);
        var new_path_components = drive_utils.split_path(new_path);

        var base_path = [];
        var name = '';
        var new_name = '';
        if (path_components.length != new_path_components.length) {
            return Promise.reject(new Error('Rename cannot change path'));
        }
        for (var i = 0; i < path_components.length; ++i) {
            var component = path_components[i];
            var new_component = new_path_components[i];
            if (i == path_components.length - 1) {
                name = component;
                new_name = new_component;
            } else {
                if (component != new_component) {
                    return Promise.reject(new Error('Rename cannot change path'));
                }
                base_path.push(component);
            }
        }

        return gapi_utils.gapi_ready
        .then(function() {
            return drive_utils.get_id_for_path(path)
        })
        .then(function(file_id) {
            var body = {'title': new_name};
            var request = gapi.client.drive.files.patch({
                'fileId': file_id,
                'resource': body
            });
            return gapi_utils.execute(request);
        })
        .then(function(resource) {
            that.observe_file_resource(resource);
            return files_resource_to_contents_model(new_path, resource);
        });
    };

    /**
     * Given a path and a model, save the document.
     * If the resource has been modifeied on Drive in the
     * meantime, prompt user for overwrite.
     **/
    Contents.prototype.save = function(path, model) {
        var that = this;
        var path_and_filename = utils.url_path_split(path);
        var path = path_and_filename[0];
        var filename = path_and_filename[1];
        return drive_utils.get_resource_for_path(path, drive_utils.FileType.FOLDER)
        .then(function(folder_resource) {
            return drive_utils.get_resource_for_relative_path(filename, drive_utils.FileType.FILE, false, folder_resource['id'])
            .then(function(file_resource) {
                return that.save_existing(file_resource, model)
            }, function(error) {
                // If the file does not exist (but the directory does) then a
                // new file must be uploaded.
                if (error.name !== 'NotFoundError') {
                    return Promise.reject(error);
                }
                model['name'] = filename;
                return that.upload_new(folder_resource['id'], model)
            });
        })
        .then(function(file_resource) {
            that.observe_file_resource(file_resource);
            return files_resource_to_contents_model(path, file_resource);
        });
    };


    Contents.prototype.copy = function(path, model) {
        return Promise.reject(new Error('Copy not implemented yet.'));
    };

    /**
     * Checkpointing Functions
     */

    // NOTE: it would be better modify the API to combine create_checkpoint with
    // save
    Contents.prototype.create_checkpoint = function(path, options) {
        var that = this;
        return gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.FILE))
        .then(function(file_id) {
            var revision_id = that.last_observed_revision[file_id];
            if (!revision_id) {
                return Promise.reject(new Error('File must be saved before checkpointing'));
            }
            var body = {'pinned': true};
            var request = gapi.client.drive.revisions.patch({
                'fileId': file_id,
                'revisionId': revision_id,
                'resource': body
            });
            return gapi_utils.execute(request);
        })
        .then(function(item) {
            return {
                last_modified: item['modifiedDate'],
                id: item['id'],
                drive_resource: item
            };
        });
    };

    Contents.prototype.restore_checkpoint = function(path, checkpoint_id, options) {
        var file_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.FILE))

        var contents_prm = file_id_prm.then(function(file_id) {
            var request = gapi.client.drive.revisions.get({
                'fileId': file_id,
                'revisionId': checkpoint_id
            });
            return gapi_utils.execute(request);
        })
        .then(function(response) {
            return gapi_utils.download(response['downloadUrl']);
        })

        return Promise.all([file_id_prm, contents_prm])
        .then(function(values) {
            var file_id = values[0];
            var contents = values[1];
            return drive_utils.upload_to_drive(contents, undefined, file_id);
        });
    };

    Contents.prototype.list_checkpoints = function(path, options) {
        return gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.FILE))
        .then(function(file_id) {
            var request = gapi.client.drive.revisions.list({'fileId': file_id });
            return gapi_utils.execute(request);
        })
        .then(function(response) {
            return response['items']
            .filter(function(item) { return item['pinned']; })
            .map(function(item) {
                return {
                    last_modified: item['modifiedDate'],
                    id: item['id'],
                    drive_resource: item
                };
            });
        });
    };

    /**
     * File management functions
     */

    /**
     * List notebooks and directories at a given path
     *
     * On success, load_callback is called with an array of dictionaries
     * representing individual files or directories.  Each dictionary has
     * the keys:
     *     type: "notebook" or "directory"
     *     name: the name of the file or directory
     *     created: created date
     *     last_modified: last modified dat
     *     path: the path
     * @method list_notebooks
     * @param {String} path The path to list notebooks in
     * @param {Object} options Object with the following keys
     *     success: success callback
     *     error: error callback
     */
    Contents.prototype.list_contents = function(path, options) {
        var that = this;
        return gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.FOLDER))
        .then(function(folder_id) {
            // Gets contents of the folder 1000 items at a time.  Google Drive
            // returns at most 1000 items in each call to drive.files.list.
            // Therefore we need to make multiple calls, using the following
            // recursive method.

            // Returns all items starting from the specified page token
            // (or from the start if no page token is specified), and
            // combines these with the items given.
            var get_items = function(items, page_token) {
                var query = ('\'' + folder_id + '\' in parents'
                             + ' and trashed = false');
                var params = {
                    'maxResults' : 1000,
                    'q' : query
                };
                if (page_token) {
                    params['pageToken'] = page_token;
                };
                var request = gapi.client.drive.files.list(params)
                return gapi_utils.execute(request)
                .then(function(response) {
                    var combined_items = items.concat(response['items']);
                    var next_page_token = response['nextPageToken'];
                    if (next_page_token) {
                        return get_items(combined_items, next_page_token);
                    }
                    return combined_items;
                });
            };
            return get_items([]);
        })
        .then(function(items) {
            var list = $.map(items, function(resource) {
                var fullpath = utils.url_path_join(path, resource['title']);
                return files_resource_to_contents_model(fullpath, resource)
            });
            return {content: list};
        });
    };



    return {'Contents': Contents};
});
