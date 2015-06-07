import iface = require('content-interface');
import IContents = iface.IContents;
import Path = iface.Path;
import CheckpointId = iface.CheckpointId;
/** Enum for object types */
export declare enum ArgType {
    PATH = 1,
    FILE = 2,
    LIST = 3,
    OTHER = 4,
}
export interface File {
    path: Path;
}
export interface FileList {
    contents: any;
}
export interface FileSystem extends Object {
    then?: any;
}
export declare class MixedContents implements IContents {
    private _config;
    private _filesystem;
    constructor(options: any);
    /**
     * Generates the object that represents a filesystem
     * @param {Object} filesystem
     * @return {Object} An object representing a virtual directory.
     */
    private _virtual_fs_roots(filesystem);
    /**
     * Routing functions
     */
    /**
     * Determine which Contents instance to use.
     * @param {Object} filesystem
     * @param {String} path The path to check.
     * @return {String} The root path for the contents instance.
     */
    get_fs_root(filesystem: FileSystem, path: Path): Path;
    /**
     * Convert a path from the virtual filesystem used by the front end, to the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    from_virtual_path(root: Path, path: Path, config: any): Path;
    /**
     * Convert a path to the virtual filesystem used by the front end, from the
     * concrete filesystem used by the Contents instance.
     * @param {String} root The root of the virtual mount point.
     * @param {String} path The path to convert.
     * @return {String} the converted path
     *
     */
    private _to_virtual_path(root, path);
    /**
     * Takes a file model, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {File} file The file model (this is modified by the function).
     * @return {File} the converted file model
     */
    private _to_virtual_file(root, file);
    /**
     * Takes a file list, and convert its path to the virtual filesystem.
     * from Google Drive format
     * @param {String} root The root of the virtual mount point.
     * @param {Object} list The file list (this is modified by the function).
     * @return {Object} The converted file list
     */
    private _to_virtual_list(root, list);
    private _to_virtual(root, type, object);
    from_virtual(root: Path, type: ArgType, object: any, config: any): any;
    /**
     * Route a function to the appropriate content manager class
     * @param {string} method_name Name of the method being called
     * @param {Array} arg_types Types of the arguments to the function
     * @param {Array} return_types Type of the return value of the function
     * @param {Array} args the arguments to apply
     */
    private _route_function(method_name, arg_types, return_type, args);
    /**
     * File management functions
     */
    get(path: Path, type: ArgType, options: any): any;
    new_untitled(path: Path, options: any): any;
    delete(path: Path): any;
    rename(path: Path, new_path: Path): any;
    save(path: Path, model: any, options: any): any;
    list_contents(path: Path, options: any): any;
    copy(from_file: Path, to_dir: Path): any;
    /**
     * Checkpointing Functions
     */
    create_checkpoint(path: Path, options: any): any;
    restore_checkpoint(path: Path, checkpoint_id: CheckpointId, options: any): any;
    list_checkpoints(path: Path, options: any): any;
}
export declare var Contents: typeof MixedContents;
