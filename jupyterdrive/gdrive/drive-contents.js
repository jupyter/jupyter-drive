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
    var picker_utils = require('./picker_utils');

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

        /**
         * Stores the revision id from the last save or load.  This is used
         * when checking if a file has been modified by another user.
         */
        this.last_observed_revision = {};
        gapi_utils.gapi_ready.then(drive_utils.set_user_info);
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
            return gapi_utils.download(resource['downloadUrl'])
            .catch(function(error){
                if (error.xhr.status != 404) {
                    return error;  // Should this be Promise.reject(error)???
                }
                return picker_utils.pick_file(resource.parents[0]['id'], resource['title'])
                .then(function() { return gapi_utils.download(resource['downloadUrl']); });
            });
        })

        return Promise.all([metadata_prm, contents_prm]).then(function(values) {
            var metadata = values[0];
            var contents = values[1];
            var model = files_resource_to_contents_model(path, metadata, contents);
            return model;
        });
    };

    Contents.prototype._new_untitled_dir = function(path, options){

        var folder_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.Folder));

        var filename_prm = folder_id_prm.then(
                function(data){ return drive_utils.get_new_filename(data, '', 'Untilted_Folder');}
        );

        return Promise.all([folder_id_prm, filename_prm]).then(function(values) {
            var folder_id = values[0];
            var filename = values[1];
            var mime = drive_utils.FOLDER_MIME_TYPE;

            var metadata = {
                'parents' : [{'id' : folder_id}],
                'title' : filename,
                'mimeType':mime
            }
            return gapi_utils.execute(gapi.client.drive.files.insert({'resource': metadata}));
        })


    }

    /**
     * Creates a new file at the specified directory path.
     *
     * @method new_untitled
     * @param {String} path The directory in which to create the new file
     * @param {Object} options Includes 'extension' - the extension to use if name not specified.
     */
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
        if(options.type == 'directory'){
            return this._new_untitled_dir(path, options);

        }
        var folder_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.Folder))
        var filename_prm = folder_id_prm.then(
                function(data){ return drive_utils.get_new_filename(data, options.ext)}
        );
        return Promise.all([folder_id_prm, filename_prm]).then(function(values) {
            var folder_id = values[0];
            var filename = values[1];
            var contents;
            var mime;
            if(options.type === 'notebook'){
                contents = notebook_model.file_contents_from_notebook(
                    notebook_model.new_notebook()
                );
                mime = drive_utils.NOTEBOOK_MIMETYPE;
            } else if (options.type === 'file'){
                contents = ''; 
                mime = 'text/plain';
            } else {
                Promise.reject(new Error("I do not know how to create "+options.type+" (yet)"));
            }
            var metadata = {
                'parents' : [{'id' : folder_id}],
                'title' : filename,
                'mimeType':mime
            }
            return drive_utils.upload_to_drive(contents, metadata);
        })
        .then(function(resource) {
            var fullpath = path + '/' + resource['title'];
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
            return files_resource_to_contents_model(path, resource);
        });
    };

    /**
     * Given a path and a model, save the document.
     * If the resource has been modifeied on Drive in the 
     * meantime, prompt user for overwrite.
     **/
    Contents.prototype.save = function(path, model) {

        var that = this;
        return drive_utils.get_resource_for_path(path, drive_utils.FileType.FILE)
        .then(function(resource) {
            if (model.type === 'notebook'){

                var contents =
                    notebook_model.file_contents_from_notebook(model.content);
            } else {
                var contents = model.content;
            }

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
        })
        .then(function(resource) {
            that.observe_file_resource(resource);
            console.warn('shoudl observe');
            return files_resource_to_contents_model(path, resource);
        });
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
                var fullpath = path + '/' + resource['title'];
                return files_resource_to_contents_model(fullpath, resource)
            });
            return {content: list};
        });
    };



    return {'Contents': Contents};
});
