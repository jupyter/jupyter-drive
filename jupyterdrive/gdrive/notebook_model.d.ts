export interface Cell {
    source: any;
    metadata: any;
}
export interface Notebook {
    cells: Cell[];
    metadata: any;
    nbformat: number;
    nbformat_minor: number;
}
/**
 * Functions related to the Notebook JSON representation
 *
 * These functions replicate logic that would usually be performed by
 * the notebook server: creating new notebooks, and converting to/from
 * the on-disk format.
 */
export declare module notebook_model {
    /**
     * Creates a JSON notebook representation from the contents of a file.
     * @param {String} contents The contents of the file, as a string.
     * @return {Object} a JSON representation of the notebook.
     */
    var notebook_from_file_contents: (contents: string) => Notebook;
    /**
     * Creates the contents of a file from a JSON notebook representation.
     * @param {Object} notebook a JSON representation of the notebook.
     * @return {Object} The JSON representation with lines split.
     */
    var file_contents_from_notebook: (notebook: Notebook) => Notebook;
    /**
     * Create a JSON representation of a new notebook
     * @param {string} name Notebook name
     * @return {Object} JSON representation of a new notebook.
     */
    var new_notebook: () => Notebook;
}
