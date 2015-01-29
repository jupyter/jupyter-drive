// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

define(function(require) {
    var gapi_utils = require('./gapi_utils');

    /**
     * Gets the user to pick a file in the file picker.  This indicates to
     * Google Drive that the user has consented to open that file with this
     * app, and therefore the app is able to access the file under drive.file
     * scope.
     * @param {String} parent_id The folder id of the parent folder
     * @param {String} filename The name (not id) of the file
     * @param {Promise} a Promise resolved when user selects file, or rejected if
     *     they cancel.
     */
    var pick_file = function(parent_id, filename) {
        return new Promise(function(resolve, reject) {
            var callback = function(response) {
                if (response['action'] == google.picker.Action.CANCEL) {
                    var reason = 'This file cannot be opened unless you select it in the Google Drive file picker.';
                    var error = new Error(reason);
                    error.name = 'DriveDownloadError';
                    reject(error);
                } else if (response['action'] == google.picker.Action.PICKED) {
                    resolve();
                }
            };
            var builder = new google.picker.PickerBuilder();

            var search_view = new google.picker.DocsView(google.picker.ViewId.DOCS)
                .setMode(google.picker.DocsViewMode.LIST)
                .setParent(parent_id)
                .setQuery(filename);

            var picker = builder
                .addView(search_view)
                .setOAuthToken(gapi.auth.getToken()['access_token'])
                .setAppId(gapi_utils.APP_ID)
                .setCallback(callback)
                .build();

            picker.setVisible(true);
        });
    };

    var picker_utils = {
        pick_file: pick_file
    };

    return picker_utils;
});
