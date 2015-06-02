export declare class Content {
    base_url: string;
    config: any;
    last_observed_revision: any;
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
    observe_file_resource(resource: any): void;
    /**
     * Saves a version of an existing file on drive
     * @param {Object} resource The Drive resource representing the file
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    save_existing(resource: any, model: any): any;
    /**
     * Uploads a model to drive
     * @param {string} folder_id The id of the folder to create the file in
     * @param {Object} model The IPython model object to be saved
     * @return {Promise} A promise fullfilled with the resource of the saved file.
     */
    upload_new(folder_id: any, model: any): any;
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
    get(path: any, options: any): Promise<{
        type: string;
        name: any;
        path: any;
        created: any;
        last_modified: any;
        content: any;
        writable: any;
    }>;
    /**
     * Creates a new untitled file or directory in the specified directory path.
     *
     * @method new
     * @param {String} path: the directory in which to create the new file/directory
     * @param {Object} options:
     *      ext: file extension to use
     *      type: model type to create ('notebook', 'file', or 'directory')
     */
    new_untitled(path: any, options: any): Promise<any>;
    delete(path: any): any;
    rename(path: any, new_path: any): any;
    /**
     * Given a path and a model, save the document.
     * If the resource has been modifeied on Drive in the
     * meantime, prompt user for overwrite.
     **/
    save(path: string, model: any): any;
    copy(path: any, model: any): Promise<any>;
    /**
     * Checkpointing Functions
     */
    create_checkpoint(path: any, options: any): any;
    restore_checkpoint(path: any, checkpoint_id: any, options: any): Promise<any>;
    list_checkpoints(path: any, options: any): any;
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
    list_contents(path: any, options: any): any;
}
