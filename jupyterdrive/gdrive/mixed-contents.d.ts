export interface File {
    path: string;
}
export interface FileList {
    contents: any;
}
export declare class Contents {
    config: any;
    filesystem: any;
    constructor(options: any);
    /**
     * Generates the object that represents a filesystem
     * @param {Object} filesystem
     * @return {Object} An object representing a virtual directory.
     */
    virtual_fs_roots(filesystem: any): {
        type: string;
        name: string;
        path: string;
    }[];
    /**
     * Routing functions
     */
    /**
     * Determine which Contents instance to use.
     * @param {Object} filesystem
     * @param {String} path The path to check.
     * @return {String} The root path for the contents instance.
     */
    get_fs_root(filesystem: string, path: string): string;
    /**
     * Convert a path from the virtual filesystem used by the front end, to the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    from_virtual_path(root: string, path: string, config: any): string;
    /**
     * Convert a path to the virtual filesystem used by the front end, from the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    to_virtual_path(root: string, path: string): string;
    /**
     * Takes a file model, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {File} file The file model (this is modified by the function).
     * @return {File} the converted file model
     */
    to_virtual_file(root: string, file: File): File;
    /**
     * Takes a file list, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {Object} list The file list (this is modified by the function).
     * @return {Object} The converted file list
     */
    to_virtual_list(root: string, list: FileList): FileList;
    to_virtual(root: string, type: any, object: any): any;
    from_virtual(root: string, type: any, object: any, config: any): any;
    /**
     * Route a function to the appropriate content manager class
     * @param {string} method_name Name of the method being called
     * @param {Array} arg_types Types of the arguments to the function
     * @param {Array} return_types Type of the return value of the function
     * @param {Array} args the arguments to apply
     */
    route_function(method_name: any, arg_types: any, return_type: any, args: any): any;
    /**
     * File management functions
     */
    get(path: any, type: any, options: any): any;
    new_untitled(path: string, options: any): any;
    delete(path: any): any;
    rename(path: any, new_path: any): any;
    save(path: any, model: any, options: any): any;
    list_contents(path: any, options: any): any;
    copy(from_file: any, to_dir: any): any;
    /**
     * Checkpointing Functions
     */
    create_checkpoint(path: any, options: any): any;
    restore_checkpoint(path: any, checkpoint_id: any, options: any): any;
    list_checkpoints(path: any, options: any): any;
}
