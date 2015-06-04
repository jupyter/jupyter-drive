/**
 * Interface that a content manager should implement
 **/
export interface IContents {
    /**
     * get a something by path
     **/
    get(path: Path, type: any, options: any): any;
    new_untitled(path: Path, options: any): any;
    delete(path: Path): any;
    rename(path: Path, new_path: Path): any;
    save(path: Path, model: any, options?: any): any;
    list_contents(path: Path, options: any): any;
    copy(path: Path, model: any): Promise<any>;
    create_checkpoint(path: Path, options: any): any;
    restore_checkpoint(path: Path, checkpoint_id: CheckpointId, options: any): Promise<any>;
    list_checkpoints(path: Path, options: any): any;
}
export interface CheckpointId extends Object {
}
export interface Path extends String {
}
