
/**
 * Interface that a content manager should implement
 **/
export interface IContents {
    get(path, type, options):any
    new_untitled
    delete
    rename
    save
    list_contents
    copy
    create_checkpoint
    restore_checkpoint
    list_checkpoints
}
