export interface Cell {
    source: any;
    metadata: Object;
}
export interface Notebook {
    cells: Cell[];
    metadata: Object;
    nbformat: number;
    nbformat_minor: number;
}
/**
 * Creates a JSON notebook representation from the contents of a file.
 * @param {String} contents The contents of the file, as a string.
 * @return {Object} a JSON representation of the notebook.
     */
export declare var notebook_from_file_contents: (contents: string) => Notebook;
/**
 * Creates the contents of a file from a JSON notebook representation.
 * @param {Object} notebook a JSON representation of the notebook.
 * @return {Object} The JSON representation with lines split.
 */
export declare var notebook_json_contents_from_notebook: (notebook: Notebook) => Notebook;
/**
 * Creates the contents of a file from a JSON notebook representation.
 * @param {Object} notebook a JSON representation of the notebook.
 * @return {String} The JSON representation with lines split.
 */
export declare var file_contents_from_notebook: (notebook: Notebook) => string;
/**
 * Create a JSON representation of a new notebook
 * @param {string} name Notebook name
 * @return {Object} JSON representation of a new notebook.
 */
export declare var new_notebook: () => Notebook;
