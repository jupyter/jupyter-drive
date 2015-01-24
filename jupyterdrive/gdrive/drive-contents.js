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

    /**
     * Utility functions
     */

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
    var files_resource_to_contents_model = function(path, resource) {
        var title = resource['title'];
        var mimetype = resource['mimeType']

        // Determine resource type.
        var nbextension = '.ipynb';
        var type = 'file';
        if (mimetype === drive_utils.FOLDER_MIME_TYPE) {
            type = 'directory';
        } else if (mimetype === drive_utils.NOTEBOOK_MIMETYPE ||
            title.indexOf(nbextension, title.length - nbextension.length) !== -1) {
            type = 'notebook';
        }
        return {
            type: type,
            name: title,
            path: path,
            created: resource['createdDate'],
            last_modified: resource['modifiedDate']
        };
    };

    /**
     * A utility class to detect cloberring of files by other users
     */
    var ClobberDetector = function() {
        /**
         * Stores the last few UUIDs that were attached to the last save
         * for a given file.  This is used when checking if a file has been
         *  modified by another user.
         */
        this.save_uuids = {};
    };

    /**
     * @type {String}
     * A UUID used to detect when other users overwrite saves done by
     * this client.  If this property of the file changes, then
     * the user is warned that another user is also saving to the file
     * and that user's work will be overwritten.
     */
    ClobberDetector.SAVE_UUID_KEY = 'save_uuid';

    /**
     * @type {Number}
     * The number of UUIDs per file to keep track of.
     */
    ClobberDetector.NUM_UUIDS_IN_CACHE = 100;

    ClobberDetector.prototype.add_uuid_to_cache = function(resource, uuid) {
        var file_id = resource['id'];
        this.save_uuids[file_id] = this.save_uuids[file_id] || [];
        var uuids = this.save_uuids[file_id];
        uuids.push(uuid);
        if (uuids.length > ClobberDetector.NUM_UUIDS_IN_CACHE) {
            uuids.shift();
        }
        console.log(uuids);
    }

    /**
     * Returns a UUID
     * @return {string}
     */
    ClobberDetector.prototype.create_uuid = function() {
        return Math.random().toString().substr(2);
    }

    /**
     * Returns file metadata that sets a custom property to record
     * the provided uuid as the id of the last save
     * @return {Object}
     */
    ClobberDetector.prototype.create_metadata = function(uuid) {
        return {
            'properties' : [{
                'visibility': 'PRIVATE',  // only visible to this app
                'key': ClobberDetector.SAVE_UUID_KEY,
                'value': uuid
            }]
        };
    };

    /**
     * Should be called whenever a file loaded.  Since the file being
     * loaded is the one that will populate this document, the SAVE_ID
     * of this file will be assumed not to indicate cloberring.
     * @param {Object} resource The Fiels resource of the file that was
     *     loaded.
     */
    ClobberDetector.prototype.on_load_file = function(resource) {
        // Go through all properties, searching for the relevant property,
        // and record it if it exists.
        var that = this;
        if (!resource['properties']) { return; }
        resource['properties'].forEach(function(property) {
            if (property['visibility'] === 'PRIVATE'
                && property['key']=== ClobberDetector.SAVE_UUID_KEY) {
                that.add_uuid_to_cache(resource, property['value']);
            }
        });
    };

    /**
     * Should be called whenever a new version of the file is uploaded
     * to drive.  Returns metadata that should be uploaded along with
     * the file.  This metadata identifies the last save.
     * @param {Object} resource The Files resource of the file being saved
     * @return {Object} metdata to upload with the file.
     */
    ClobberDetector.prototype.on_upload_new_version = function(resource) {
        var uuid = this.create_uuid();
        this.add_uuid_to_cache(resource, uuid);
        return this.create_metadata(uuid);
    };

    /**
     * Detects whether a file has been clobbered by another user
     * @return {Bool} True if clobbering is detected.
     */
    ClobberDetector.prototype.has_clobber_occurred = function(resource) {
        console.log(this.save_uuids);
        var uuids = this.save_uuids[resource['id']];
        // In the unlikely event that there are no uuid's for this file
        // assume no clobbering has occurred.
        if (!uuids) { return false; }
        return !resource['properties'].some(function(property) {
            return property['visibility'] === 'PRIVATE'
                && property['key'] === ClobberDetector.SAVE_UUID_KEY
                && uuids.indexOf(property['value']) != -1;
        });
    };

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

        this.clobber_detector = new ClobberDetector();

        gapi_utils.gapi_ready.then(drive_utils.set_user_info);
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
    Contents.prototype.get = function (path, type, options) {
        var that = this;
        var metadata_prm = gapi_utils.gapi_ready.then(
            $.proxy(drive_utils.get_resource_for_path, this, path, drive_utils.FileType.FILE));
        var contents_prm = metadata_prm.then(function(resource) {
            return gapi_utils
                .download(resource['downloadUrl'])
                .catch(function(data){
                    var reason ='Unknown Error.';
                    if( data.xhr.status === 404){
                        reason = 'We cannot access requested resource. \n'+
                                 'This can happen if the resource was not created with jupyter drive.\n'+
                                 'Please re-upload the resource by dragging a copy of the file onto the Jupyter file manager';
                    } else if (data.xhr.status === 401){
                        reason = "You don't have permission to access this resource";
                    }
                    var error = new Error(reason);
                    error.name = 'DriveDownloadError';
                    return Promise.reject(error);
                });
        });
        return Promise.all([metadata_prm, contents_prm]).then(function(values) {
            var metadata = values[0];
            var contents = values[1];
            // Let the clobber detector see the metadata for the file we just
            // loaded.
            that.clobber_detector.on_load_file(metadata);
            var model = files_resource_to_contents_model(path, metadata);
            model['content'] = notebook_model.notebook_from_file_contents(contents);
            model['writable'] = metadata['editable'];
            return model;
        });
    };

    /**
     * Creates a new file at the specified directory path.
     *
     * @method new_untitled
     * @param {String} path The directory in which to create the new file
     * @param {Object} options Includes 'extension' - the extension to use if name not specified.
     */
    Contents.prototype.new_untitled = function(path, options) {
        var folder_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path, drive_utils.FileType.Folder))
        var filename_prm = folder_id_prm.then(drive_utils.get_new_filename);
        return Promise.all([folder_id_prm, filename_prm]).then(function(values) {
            var folder_id = values[0];
            var filename = values[1];
            var contents = notebook_model.file_contents_from_notebook(
                notebook_model.new_notebook());
            var metadata = {
                'parents' : [{'id' : folder_id}],
                'title' : filename,
                'description': 'IP[y] file',
                'mimeType': drive_utils.NOTEBOOK_MIMETYPE,
                'properties': [{
                    'visibility': 'PRIVATE',
                    'key': ClobberDetector.SAVE_UUID_KEY,
                    'value': 'INITIAL_UPLOAD'
                }]
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
            return files_resource_to_contents_model(path, resource);
        });
    };

    Contents.prototype.save = function(path, model, options) {
        var that = this;
        return drive_utils.get_resource_for_path(path, drive_utils.FileType.FILE)
        .then(function(resource) {
            var contents =
        notebook_model.file_contents_from_notebook(model.content);
            var save = function() {
                // Get metadata to upload with this file, so that the clobber
                // detector can recognize the version just saved.
                var metadata = that.clobber_detector.on_upload_new_version(resource);
                return drive_utils.upload_to_drive(contents, metadata, resource['id']);
            };

            if (that.clobber_detector.has_clobber_occurred(resource)) {
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
            return files_resource_to_contents_model(path, resource);
        });
    };

    /**
     * Checkpointing Functions
     */

    // NOTE: it would be better modify the API to combine create_checkpoint with
    // save
    Contents.prototype.create_checkpoint = function(path, options) {
        return Promise.reject(new Error('create_checkpoint not implemented'));
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
            return drive_utils.upload_to_drive(contents, {}, file_id);
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
                }
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
