// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'base/js/namespace',
    'jquery',
    'custom/gapi_utils',
], function(IPython, $, gapi_utils) {
    var FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

    /**
     * Name of newly created notebook files.
     * @type {string}
     */
    var NEW_NOTEBOOK_TITLE = 'Untitled';

    /**
     * Extension for notebook files.
     * @type {string}
     */
    var NOTEBOOK_EXTENSION = 'ipynb';

    var MULTIPART_BOUNDARY = '-------314159265358979323846';

    var NOTEBOOK_MIMETYPE = 'application/ipynb';

    /** Enum for file types */
    var FileType = {
        FILE : 1,
        FOLDER: 2
    };

    /**
     * Gets the Google Drive file/folder ID corresponding to a path.  Since
     * the Google Drive API doesn't expose a path structure, it is necessary
     * to manually walk the path from root.
     * @method get_id_for_path
     * @param {String} path The path
     * @param {FileType} type The type (file or folder)
     * @return {Promise} fullfilled with folder id (string) on success
     *     or Error object on error.
     */
    var get_id_for_path = function(path, type) {
        type = type || FileType.FOLDER; // is this bad style for enums?
        function get_id_for_relative_path(component, type, base_id) {
            var query = 'title = \'' + component + '\' and trashed = false';
            var request = null;
            if (type == FileType.FILE) {
                query += ' and \'' + base_id + '\' in parents';
                request = gapi.client.drive.files.list({
                    'q': query
                });
	    } else if (type == FileType.FOLDER) {
                query += ' and mimeType = \'' + FOLDER_MIME_TYPE + '\'';
	        request = gapi.client.drive.children.list({
                    'folderId': base_id,
                    'q': query
                });
            }
            return gapi_utils.wrap_gapi_request(request)
            .then(function(response) {
                var children = response['items'];
		if (!children) {
		    // 'directory does not exist' error.
		    return $.Deferred().reject().promise();
		}
		if (children.length != 1) {
		    // 'runtime error' this should not happen
		    return $.Deferred().reject().promise();
		}
		if (type == FileType.FILE) {
		    return children[0];
		} else {
		    return children[0]['id'];
		}
	    });
        };
        var result = $.Deferred().resolve('root');
        var components = path.split('/');
        for(var i = 0; i < components.length; i++) {
            var c = components[i];
            var t = (i == components.length - 1) ? type : FileType.Folder;
            if (c === '') { continue; }
            result = result.then($.proxy(get_id_for_relative_path, this, c, t));
	};
        return result;
    }


    /**
     * Obtains the filename that should be used for a new file in a given
     * folder.  This is the next file in the series Untitled0, Untitled1, ... in
     * the given drive folder.  As a fallback, returns Untitled.
     *
     * @method get_new_filename
     * @param {function(string)} callback Called with the name for the new file.
     * @param {string} opt_folderId optinal Drive folder Id to search for
     *     filenames.  Uses root, if none is specified.
     * @return A promise fullfilled with the new filename.  In case of errors,
     *     'Untitled.ipynb' is used as a fallback.
     */
    var get_new_filename = function(opt_folderId) {
        /** @type {string} */
        var folderId = opt_folderId || 'root';
        var query = 'title contains \'' + NEW_NOTEBOOK_TITLE + '\'' +
            ' and \'' + folderId + '\' in parents' +
            ' and trashed = false';
        var request = gapi.client.drive.files.list({
            'maxResults': 1000,
            'folderId' : folderId,
            'q': query
        });

        var fallbackFilename = NEW_NOTEBOOK_TITLE + '.' + NOTEBOOK_EXTENSION;
        return gapi_utils.wrap_gapi_request(request)
        .then(function(response) {
            // Use 'Untitled.ipynb' as a fallback in case of error
            var files = response['items'] || [];
            var existingFilenames = $.map(files, function(filesResource) {
                return filesResource['title'];
            });

            // Loop over file names Untitled0, ... , UntitledN where N is the number of
            // elements in existingFilenames.  Select the first file name that does not
            // belong to existingFilenames.  This is guaranteed to find a file name
            // that does not belong to existingFilenames, since there are N + 1 file
            // names tried, and existingFilenames contains N elements.
            for (var i = 0; i <= existingFilenames.length; i++) {
                /** @type {string} */
                var filename = NEW_NOTEBOOK_TITLE + i + '.' + NOTEBOOK_EXTENSION;
                if (existingFilenames.indexOf(filename) == -1) {
                    return filename;
                }
            }

            // Control should not reach this point, so an error has occured
            return fallbackFilename;
        })
        .then(null, function(error) { return $.Deferred().resolve(fallbackFilename).promise(); });
    };


    /**
     * Uploads a notebook to Drive, either creating a new one or saving an
     * existing one.
     *
     * @method upload_to_drive
     * @param {string} data The file contents as a string
     * @param {Object} metadata File metadata
     * @param {string=} opt_fileId file Id.  If false, a new file is created.
     * @param {Object?} opt_params a dictionary containing the following keys
     *     pinned: whether this save should be pinned
     * @return {Promise} A promise resolved with the Google Drive Files
     *     resource for the uploaded file, or rejected with an Error object.
     */
    var upload_to_drive = function(data, metadata, opt_fileId, opt_params) {
        var params = opt_params || {};
        var delimiter = '\r\n--' + MULTIPART_BOUNDARY + '\r\n';
        var close_delim = '\r\n--' + MULTIPART_BOUNDARY + '--';
        var body = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + NOTEBOOK_MIMETYPE + '\r\n' +
            '\r\n' +
            data +
            close_delim;

        var path = '/upload/drive/v2/files';
        var method = 'POST';
        if (opt_fileId) {
            path += '/' + opt_fileId;
            method = 'PUT';
        }

        var request = gapi.client.request({
            'path': path,
            'method': method,
            'params': {
                'uploadType': 'multipart',
                'pinned' : params['pinned']
            },
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' +
                MULTIPART_BOUNDARY + '"'
            },
            'body': body
        });
        return gapi_utils.wrap_gapi_request(request);
    };


    var drive_utils = {
        FOLDER_MIME_TYPE : FOLDER_MIME_TYPE,
        NOTEBOOK_MIMETYPE : NOTEBOOK_MIMETYPE,
        FileType : FileType,
        get_id_for_path : get_id_for_path,
        get_new_filename : get_new_filename,
        upload_to_drive : upload_to_drive
    }

    return drive_utils;
});