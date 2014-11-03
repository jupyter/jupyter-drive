// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    'custom/gapi_utils',
    'custom/drive_utils',
], function(IPython, $, utils, dialog, gapi_utils, drive_utils) {
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
    Contents.prototype.load = function (path, name, options) {
        gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path + '/' + name, drive_utils.FileType.FILE))
        .then(function(file_resource) {
            var defer = $.Deferred();
            // Sends request to load file to drive.
            var token = gapi.auth.getToken()['access_token'];
	    var xhrRequest = new XMLHttpRequest();
	    xhrRequest.open('GET', file_resource['downloadUrl'], true);
	    xhrRequest.setRequestHeader('Authorization', 'Bearer ' + token);
	    xhrRequest.onreadystatechange = function(e) {
		if (xhrRequest.readyState == 4) {
		    if (xhrRequest.status == 200) {
			var notebook_contents = xhrRequest.responseText;
			//colab.nbformat.convertJsonNotebookToRealtime(
			//    notebook_contents, model);
        		var model = JSON.parse(notebook_contents);
	    	        defer.resolve({
	 		    content: model,
			    // A hack to deal with file/memory format conversions
			    name: model.metadata.name
			});
		    } else {
			// TODO (wrap xhr as error)
    	               defer.reject();
		    }
		}
	    };
            xhrRequest.send()
            return defer.promise();
        })
        .then(options.success, options.error);
    };

    /**
     * Creates a new file at the specified directory path.
     *
     * @method new
     * @param {String} path The directory in which to create the new file
     * @param {String} name The name of the file to create. Server picks if unspecified.
     * @param {Object} options Includes 'extension' - the extension to use if name not specified.
     */
    Contents.prototype.new = function(path, name, options) {
        var folder_id_prm = gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path))
        // TODO: use name or extension if provided
        var filename_prm = folder_id_prm.then(drive_utils.get_new_filename);
        $.when(folder_id_prm, filename_prm).then(function(folder_id, filename) {
	    var data = {
		'worksheets': [{
		    'cells' : [{
			'cell_type': 'code',
			'input': '',
			'outputs': [],
			'language': 'python',
			'metadata': {}
		    }],
		}],
		'metadata': {
		    'name': filename,
		},
		'nbformat': 3,
		'nbformat_minor': 0
	    };
	    var metadata = {
		'parents' : [{'id' : folder_id}],
		'title' : filename,
		'description': 'IP[y] file',
		'mimeType': drive_utils.NOTEBOOK_MIMETYPE
	    }
	    return drive_utils.upload_to_drive(JSON.stringify(data), metadata);
        })
        .then(function(response) {
            return {path: path, name: response['title'] };
        })
        .then(options.success, options.error);
    };

    Contents.prototype.delete_notebook = function(name, path) {
        var settings = {
            processData : false,
            cache : false,
            type : "DELETE",
            dataType : "json",
            success : $.proxy(this.events.trigger, this.events,
                'notebook_deleted.Contents',
                {
                    name: name,
                    path: path
                }),
            error : utils.log_ajax_error
        };
        var url = utils.url_join_encode(
            this.base_url,
            'api/contents',
            path,
            name
        );
        $.ajax(url, settings);
    };

    Contents.prototype.rename_notebook = function(path, name, new_name) {
        var that = this;
        var data = {name: new_name};
        var settings = {
            processData : false,
            cache : false,
            type : "PATCH",
            data : JSON.stringify(data),
            dataType: "json",
            headers : {'Content-Type': 'application/json'},
            success :  function (json, status, xhr) {
                that.events.trigger('notebook_rename_success.Contents',
                    json);
            },
            error : function (xhr, status, error) {
                that.events.trigger('notebook_rename_error.Contents',
                    [xhr, status, error]);
            }
        }
        var url = utils.url_join_encode(
            this.base_url,
            'api/contents',
            path,
            name
        );
        $.ajax(url, settings);
    };

    Contents.prototype.save = function(path, name, model, options) {
        var contents = JSON.stringify(model.content);
        drive_utils.get_id_for_path(path + '/' + name, drive_utils.FileType.FILE)
        .then(function(resource) {
            var file_id = resource['id'];
	    var metadata = {};
            return drive_utils.upload_to_drive(contents, metadata, file_id);
        })
        .then(options.success, options.error);
    };

    /**
     * Checkpointing Functions
     */

    Contents.prototype.save_checkpoint = function() {
        // This is not necessary - integrated into save
    };

    Contents.prototype.restore_checkpoint = function(notebook, id) {
        that = notebook;
        this.events.trigger('notebook_restoring.Notebook', checkpoint);
        var url = utils.url_join_encode(
            this.base_url,
            'api/contents',
            this.notebook_path,
            this.notebook_name,
            'checkpoints',
            checkpoint
        );
        $.post(url).done(
            $.proxy(that.restore_checkpoint_success, that)
        ).fail(
            $.proxy(that.restore_checkpoint_error, that)
        );
    };

    Contents.prototype.list_checkpoints = function(path, name, options) {
        options.error(new Error('checkpoints not implemented'));
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
        gapi_utils.gapi_ready
        .then($.proxy(drive_utils.get_id_for_path, this, path))
	.then(function(folder_id) {
	    query = ('(fileExtension = \'ipynb\' or'
		+ ' mimeType = \'' + drive_utils.FOLDER_MIME_TYPE + '\')'
		+ ' and \'' + folder_id + '\' in parents'
		+ ' and trashed = false');
	    var request = gapi.client.drive.files.list({
		'maxResults' : 1000,
		'q' : query
	    });
	    return gapi_utils.wrap_gapi_request(request);
	})
	.then(function(response) {
	    // Convert this list to the format that is passed to
	    // load_callback.  Note that a files resource can represent
	    // a file or a directory.
	    // TODO: check that date formats are the same, and either
	    // convert to the IPython format, or document the difference.
	    var list = $.map(response['items'], function(files_resource) {
		var type = files_resource['mimeType'] == drive_utils.FOLDER_MIME_TYPE ? 'directory' : 'notebook';
		return {
		    type: type,
		    name: files_resource['title'],
		    path: path,
		    created: files_resource['createdDate'],
		    last_modified: files_resource['modifiedDate']
		};
	    });
	    return {content: list};
	})
        .then(options.success, options.error);;
    };


    IPython.Contents = Contents;

    return {'Contents': Contents};
});