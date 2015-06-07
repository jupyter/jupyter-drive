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
export declare function pick_file(parent_id: any, filename: any): any;
