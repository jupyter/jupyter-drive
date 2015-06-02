/**
 * Interface that a content manager should implement
 **/
export interface IContents {
    get(path: any, type: any, options: any): any;
    new_untitled: any;
    delete: any;
    rename: any;
    save: any;
    list_contents: any;
    copy: any;
    create_checkpoint: any;
    restore_checkpoint: any;
    list_checkpoints: any;
}
