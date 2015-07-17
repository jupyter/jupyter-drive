// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
"use strict";
import $ = require('jquery');
import utils = require('base/js/utils');
import dialog = require('base/js/dialog');
import gapiutils = require('./gapiutils');
import driveutils = require('./driveutils');
import notebook_model = require('./notebook_model');
import iface = require('content-interface');

import Notebook = notebook_model.Notebook;
import Path = iface.Path
import IContents = iface.IContents
import CheckpointId = iface.CheckpointId

declare var gapi;

/**
 * Takes a contents model and converts it into metadata and bytes for
 * Google Drive upload.
 */
var contents_model_to_metadata_and_bytes = function(model):[any, string] {
    var content = model.content;
    var mimetype = model.mimetype;
    var format = model.format;
    if (model['type'] === 'notebook') {
        // This seem to be wrong content is Notebook here. string below
        content = notebook_model.notebook_json_contents_from_notebook(content);
        format = 'json';
        mimetype = driveutils.NOTEBOOK_MIMETYPE;
    } else if (model['type'] === 'file') {
        format = format || 'text/plain';
    } else if (model['type'] === 'directory') {
        format = 'json'
        mimetype = driveutils.FOLDER_MIME_TYPE;
    } else {
        throw ("Unrecognized type " + model['type']);
    }

    // Set mime type according to format if it's not set
    if (format == 'json') {
        // This seem to have been wrong content, as type was String Here,
        // instead of a Notebook Json model. This lead to double serialisation.
        // as typescript does not seem to catch that, let's be safe.
        if(typeof(content) === 'string'){
          console.warn(new Error('(\\)(°,,°)(\\) blblblblbl you are stringifying a string, bailing out'))
        } else {
          content = JSON.stringify(content);
        }
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
 * Converts a Google Drive files resource, (see https://developers.google.com/drive/v2/reference/files)
 * to an IPEP 27 contents model (see https://github.com/ipython/ipython/wiki/IPEP-27:-Contents-Service)
 *
 * Note that files resources can represent files or directories.
 *
 * TODO: check that date formats are the same, and either
 * convert to the IPython format, or document the difference.
 *
 * @param {string} path Path of resoure (including file name)
 * @param {Object} resource Google Drive files resource
 * @return {Object} IPEP 27 compliant contents model
 */
// TODO remove contents ?
var files_resource_to_contents_model = function(path:Path, resource, content?) {
    var title = resource['title'];
    var mimetype = resource['mimeType'];

    // Determine resource type.
    var nbextension = '.ipynb';
    var type = 'file';
    var model_content;
    if (mimetype === driveutils.FOLDER_MIME_TYPE) {
        type = 'directory';
    } else if (mimetype === driveutils.NOTEBOOK_MIMETYPE ||
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
 *
 * Implement a contents manager that talks to Google Drive.  Expose itself also
 * as `Contents` to be able to by transparently dynamically loaded and replace
 * any other contents manager that expose the `IContents` interface.
 *
 * For a higher level description on how to use these interfaces, see the
 * `IContents` interface docs
 *
 **/
export class GoogleDriveContents implements IContents {

    private _base_url:string;
    private _config:any;
    private _last_observed_revision:any;

    /**
     *
     * A contentmanager handles passing file operations
     * to the back-end.  This includes checkpointing
     * with the normal file operations.
     *
     * Parameters:
     *  options: dictionary
     *      Dictionary of keyword arguments.
     *          base_url: string
     **/
    constructor(options) {
        this._base_url = options.base_url;
        this._config  = options.common_config;
        /**
         * Stores the revision id from the last save or load.  This is used
         * when checking if a file has been modified by another user.
         */
        this._last_observed_revision = {};
        var that = this;
        this._config.loaded.then((data) => {
          gapiutils.config(this._config);
          gapiutils.gapi_ready.then(driveutils.set_user_info);
        })

    }

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
    private _observe_file_resource(resource) {
        this._last_observed_revision[resource['id']] = resource['headRevisionId'];
    }



    /**
     * Saves a version of an existing file on drive
     * @param {Object} resource The Drive resource representing the file
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    private _save_existing(resource, model) {
        var that = this;
        if(typeof(model) == 'string'){
          var e  = new Error("[drive-contents.ts] `_save_existing`'s model is a string");
          console.error(e);
          throw e
        }
        var converted = contents_model_to_metadata_and_bytes(model);
        var contents = converted[1];
        var save = function() {
            return driveutils.upload_to_drive(contents, undefined, resource['id']);
        };
        if (resource['headRevisionId'] !=
            that._last_observed_revision[resource['id']]) {
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
    private _upload_new(folder_id, model) {
        var that = this;

        if(typeof(model) == 'string'){
          var e  = new Error("[drive-contents.ts] `_save_existing`'s model is a string");
          console.error(e);
          throw e
        }
        var converted = contents_model_to_metadata_and_bytes(model);
        var metadata = converted[0];
        var contents = converted[1];
        metadata['parents'] = [{'id' : folder_id}];

        if (model['type'] === 'directory') {
            return gapiutils.execute(gapi.client.drive.files.insert({'resource': metadata}));
        } else {
            return driveutils.upload_to_drive(contents, metadata);
        }
    }

    /**
     * Notebook Functions
     */
    get(path:Path, options:any) {
        var that = this;
        var metadata_prm = gapiutils.gapi_ready.then(
            $.proxy(driveutils.get_resource_for_path, this, path, driveutils.FileType.FILE));
        var contents_prm = metadata_prm.then(function(resource) {
            that._observe_file_resource(resource);
            return driveutils.get_contents(resource, false);
        });

        return Promise.all([metadata_prm, contents_prm]).then(function(values) {
            var metadata = values[0];
            var contents = values[1];
            var model = files_resource_to_contents_model(path, metadata, contents);
            return model;
        });
    }


    /**
     * Creates a new untitled file or directory in the specified directory path.
     *
     * @param {String} path: the directory in which to create the new file/directory
     * @param {Object} options:
     *      ext: file extension to use
     *      type: model type to create ('notebook', 'file', or 'directory')
     */
    new_untitled(path:Path, options) {
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
                'mimetype': driveutils.NOTEBOOK_MIMETYPE,
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

        var folder_id_prm = gapiutils.gapi_ready
            .then($.proxy(driveutils.get_id_for_path, this, path, driveutils.FileType.FOLDER))
        var filename_prm = folder_id_prm.then(function(resource){
            return driveutils.get_new_filename(resource, options['ext'] || default_ext, base_name);
        });
        return Promise.all([folder_id_prm, filename_prm]).then((values) => {
            var folder_id = values[0];
            var filename = values[1];
            model['name'] = filename;
            return this._upload_new(folder_id, model);
        })
        .then(function(resource) {
            var fullpath = <Path>utils.url_path_join(<string>path, <string>resource['title']);
            return files_resource_to_contents_model(fullpath, resource);
        });
    }

    delete(path:Path) {
        return gapiutils.gapi_ready
        .then(function() {
            return driveutils.get_id_for_path(path, driveutils.FileType.FILE);
        })
        .then(function(file_id){
            return gapiutils.execute(gapi.client.drive.files.delete({'fileId': file_id}));
        });
    }

    rename(path:Path, new_path:Path) {
        var that = this;
        // Rename is only possible when path and new_path differ except in
        // their last component, so check this first.
        var path_components = driveutils.split_path(path);
        var new_path_components = driveutils.split_path(new_path);

        var base_path = [];
        var name:Path;
        var new_name:Path;
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

        return gapiutils.gapi_ready
        .then(function() {
            return driveutils.get_id_for_path(path)
        })
        .then(function(file_id) {
            var body = {'title': new_name};
            var request = gapi.client.drive.files.patch({
                'fileId': file_id,
                'resource': body
            });
            return gapiutils.execute(request);
        })
        .then(function(resource) {
            that._observe_file_resource(resource);
            return files_resource_to_contents_model(new_path, resource);
        });
    }

    /**
     * Given a path and a model, save the document.
     * If the resource has been modifeied on Drive in the
     * meantime, prompt user for overwrite.
     **/
    save(path:Path, model, options?:any) {
        var that = this;
        var path_and_filename = <Path[]>utils.url_path_split(<string>path);
        var path = path_and_filename[0];
        var filename = path_and_filename[1];
        return driveutils.get_resource_for_path(<string>path, driveutils.FileType.FOLDER)
        .then(function(folder_resource) {
            return driveutils.get_resource_for_relative_path(filename, driveutils.FileType.FILE, false, folder_resource['id'])
            .then(function(file_resource) {
                return that._save_existing(file_resource, model)
            }, function(error) {
                // If the file does not exist (but the directory does) then a
                // new file must be uploaded.
                if (error.name !== 'NotFoundError') {
                    return Promise.reject(error);
                }
                model['name'] = filename;
                return that._upload_new(folder_resource['id'], model)
            });
        })
        .then(function(file_resource) {
            that._observe_file_resource(file_resource);
            return files_resource_to_contents_model(path, file_resource);
        });
    }


    copy(path:Path, model) {
        return Promise.reject(new Error('Copy not implemented yet.'));
    }

    /**
     * Checkpointing Functions
     */

    // NOTE: it would be better modify the API to combine create_checkpoint with
    // save
    create_checkpoint(path:Path, options:any) {
        var that = this;
        return gapiutils.gapi_ready
        .then($.proxy(driveutils.get_id_for_path, this, path, driveutils.FileType.FILE))
        .then(function(file_id) {
            var revision_id = that._last_observed_revision[file_id];
            if (!revision_id) {
                return Promise.reject(new Error('File must be saved before checkpointing'));
            }
            var body = {'pinned': true};
            var request = gapi.client.drive.revisions.patch({
                'fileId': file_id,
                'revisionId': revision_id,
                'resource': body
            });
            return gapiutils.execute(request);
        })
        .then(function(item) {
            return {
                last_modified: item['modifiedDate'],
                id: item['id'],
                drive_resource: item
            };
        });
    }

    restore_checkpoint(path:Path, checkpoint_id:CheckpointId, options) {
        var file_id_prm = gapiutils.gapi_ready
        .then($.proxy(driveutils.get_id_for_path, this, path, driveutils.FileType.FILE))

        var contents_prm = file_id_prm.then(function(file_id) {
            var request = gapi.client.drive.revisions.get({
                'fileId': file_id,
                'revisionId': checkpoint_id
            });
            return gapiutils.execute(request);
        })
        .then(function(response) {
            return gapiutils.download(response['downloadUrl']);
        })

        return Promise.all([file_id_prm, contents_prm])
        .then(function(values) {
            var file_id = values[0];
            var contents = values[1];
            return driveutils.upload_to_drive(contents, undefined, file_id);
        });
    }

    list_checkpoints(path:Path, options:any) {
        return gapiutils.gapi_ready
        .then($.proxy(driveutils.get_id_for_path, this, path, driveutils.FileType.FILE))
        .then(function(file_id) {
            var request = gapi.client.drive.revisions.list({'fileId': file_id });
            return gapiutils.execute(request);
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
    }

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
    list_contents(path:Path, options):Promise<any>{
        var that = this;
        return gapiutils.gapi_ready
        .then($.proxy(driveutils.get_id_for_path, this, path, driveutils.FileType.FOLDER))
        .then(function(folder_id) {
            // Gets contents of the folder 1000 items at a time.  Google Drive
            // returns at most 1000 items in each call to drive.files.list.
            // Therefore we need to make multiple calls, using the following
            // recursive method.

            // Returns all items starting from the specified page token
            // (or from the start if no page token is specified), and
            // combines these with the items given.
            var get_items = function(items, page_token?) {
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
                return gapiutils.execute(request)
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
                var fullpath = <Path>utils.url_path_join(<string>path, resource['title']);
                return files_resource_to_contents_model(fullpath, resource)
            });
            return {content: list};
        });
    }


}

export var Contents = GoogleDriveContents
