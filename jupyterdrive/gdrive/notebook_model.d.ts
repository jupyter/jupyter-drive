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
}
