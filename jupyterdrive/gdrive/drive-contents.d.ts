import iface = require('content-interface');
import Path = iface.Path;
import IContents = iface.IContents;
import CheckpointId = iface.CheckpointId;
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
export declare class GoogleDriveContents implements IContents {
    private _base_url;
    private _config;
    private _last_observed_revision;
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
    constructor(options: any);
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
    private _observe_file_resource(resource);
    /**
     * Saves a version of an existing file on drive
     * @param {Object} resource The Drive resource representing the file
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    private _save_existing(resource, model);
    /**
     * Uploads a model to drive
     * @param {string} folder_id The id of the folder to create the file in
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    private _upload_new(folder_id, model);
    /**
     * Notebook Functions
     */
    get(path: Path, options: any): Promise<{
        type: string;
        name: any;
        path: iface.Path;
        created: any;
        last_modified: any;
        content: any;
        writable: any;
    }>;
    /**
     * Creates a new untitled file or directory in the specified directory path.
     *
     * @param {String} path: the directory in which to create the new file/directory
     * @param {Object} options:
     *      ext: file extension to use
     *      type: model type to create ('notebook', 'file', or 'directory')
     */
    new_untitled(path: Path, options: any): Promise<any>;
    delete(path: Path): any;
    rename(path: Path, new_path: Path): any;
    /**
     * Given a path and a model, save the document.
     * If the resource has been modifeied on Drive in the
     * meantime, prompt user for overwrite.
     **/
    save(path: Path, model: any, options?: any): any;
    copy(path: Path, model: any): Promise<any>;
    /**
     * Checkpointing Functions
     */
    create_checkpoint(path: Path, options: any): any;
    restore_checkpoint(path: Path, checkpoint_id: CheckpointId, options: any): Promise<any>;
    list_checkpoints(path: Path, options: any): any;
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
    list_contents(path: Path, options: any): Promise<any>;
}
export declare var Contents: typeof GoogleDriveContents;
