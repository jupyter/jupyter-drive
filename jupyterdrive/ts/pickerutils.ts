// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

import gapiutils = require('./gapiutils');
declare var Promise;
declare var google:any;
declare var gapi:any;


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
export function pick_file(parent_id, filename):any {
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
        };http://elacave.lmdb.eu/~carreau/ml/Matlab-R2011a-unix-mac.iso
        var builder = new google.picker.PickerBuilder();

        var search_view = new google.picker.DocsView(google.picker.ViewId.DOCS)
            .setMode(google.picker.DocsViewMode.LIST)
            .setParent(parent_id)
            .setQuery(filename);

        var picker = builder
            .addView(search_view)
            .setOAuthToken(gapi.auth.getToken()['access_token'])
            .setAppId(gapiutils.APP_ID)
            .setCallback(callback)
            .build();

        picker.setVisible(true);
    });
};
