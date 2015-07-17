import iface = require('content-interface');
export declare var FOLDER_MIME_TYPE: string;
export declare var NOTEBOOK_MIMETYPE: string;
export declare var MULTIPART_BOUNDARY: string;
export declare enum FileType {
    FILE = 1,
    FOLDER = 2,
}
/**
 * Obtains the Google Drive Files resource for a file or folder relative
 * to the a given folder.  The path should be a file or a subfolder, and
 * should not contain multiple levels of folders (hence the name
 * path_component).  It should also not contain any leading or trailing
 * slashes.
 *
 * @param {String} path_component The file/folder to find
 * @param {FileType} type type of resource (file or folder)
 * @param {boolean} opt_child_resource If True, fetches a child resource
 *     which is smaller and probably quicker to obtain the a Files resource.
 * @param {String} folder_id The Google Drive folder id
 * @return A promise fullfilled by either the files resource for the given
 *     file/folder, or rejected with an Error object.
 */
export declare var get_resource_for_relative_path: (path_component: String, type: FileType, opt_child_resource: Boolean, folder_id: String) => Promise<any>;
/**
 * Split a path into path components
 */
export declare var split_path: (path: iface.Path) => iface.Path[];
/**
 * Gets the Google Drive Files resource corresponding to a path.  The path
 * is always treated as an absolute path, no matter whether it contains
 * leading or trailing slashes.  In fact, all leading, trailing and
 * consecutive slashes are ignored.
 *
 * @param {String} path The path
 * @param {FileType} type The type (file or folder)
 * @return {Promise} fullfilled with file/folder id (string) on success
 *     or Error object on error.
 */
export declare var get_resource_for_path: (path: iface.Path, type?: any) => any;
/**
 * Gets the Google Drive file/folder ID for a file or folder.  The path is
 * always treated as an absolute path, no matter whether it contains leading
 * or trailing slashes.  In fact, all leading, trailing and consecutive
 * slashes are ignored.
 *
 * @param {String} path The path
 * @param {FileType} type The type (file or folder)
 * @return {Promise} fullfilled with folder id (string) on success
 *     or Error object on error.
 */
export declare var get_id_for_path: (path: any, type?: any) => any;
/**
 * Obtains the filename that should be used for a new file in a given
 * folder.  This is the next file in the series Untitled0, Untitled1, ... in
 * the given drive folder.  As a fallback, returns Untitled.
 *
 * @method get_new_filename
 * @param {function(string)} callback Called with the name for the new file.
 * @param {string} opt_folderId optinal Drive folder Id to search for
 *     filenames.  Uses root, if none is specified.
 * @param {string} ext The extension to use
 * @param {string} base_name The base name of the file
 * @return A promise fullfilled with the new filename.  In case of errors,
 *     'Untitled.ipynb' is used as a fallback.
 */
export declare var get_new_filename: (opt_folderId: any, ext: any, base_name: any) => any;
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
export declare var upload_to_drive: (data: any, metadata: any, opt_fileId?: any, opt_params?: any) => any;
export declare var GET_CONTENTS_INITIAL_DELAY: number;
export declare var GET_CONTENTS_MAX_TRIES: number;
export declare var GET_CONTENTS_EXPONENTIAL_BACKOFF_FACTOR: number;
/**
 * Attempt to get the contents of a file with the given id.  This may
 * involve requesting the user to open the file in a FilePicker.
 * @param {Object} resource The files resource of the file.
 * @param {Boolean} already_picked Set to true if this file has already
 *     been selected by the FilePicker
 * @param {Number?} opt_num_tries The number tries left to open this file.
 *     Should be set when already_picked is true.
 * @return {Promise} A promise fullfilled by file contents.
 */
export declare var get_contents: (resource: any, already_picked: boolean, opt_num_tries?: any) => any;
/**
 * Fetch user avatar url and put it in the header
 * optionally take a selector into which to insert the img tag
 *
 *
 *
 **/
export declare var set_user_info: (selector: string) => Promise<any>;
