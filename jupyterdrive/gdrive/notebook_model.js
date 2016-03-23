// AUTOMATICALY GENERATED FILE, see cooresponding .ts file
// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
//
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * Functions related to the Notebook JSON representation
     *
     * These functions replicate logic that would usually be performed by
     * the notebook server: creating new notebooks, and converting to/from
     * the on-disk format.
     */
    /**
     * Utility method to transform a notebook.
     * @param {Object} notebook JSON representation of a notebook.  Note this
     *     notebook gets mutated in this function.
     * @param {Function} transform_fn that will be applied to every object
     *     that can be a multiline string according to IPEP 17.
     */
    var transform_notebook = function (notebook, transform_fn) {
        if (!notebook['cells']) {
            return null;
        }
        notebook['cells'].forEach(function (cell) {
            if (cell['source']) {
                cell['source'] = transform_fn(cell['source']);
            }
            if (cell['outputs']) {
                cell['outputs'].forEach(function (output) {
                    if (output['data']) {
                        output['data'] = transform_fn(output['data']);
                    }
                });
            }
        });
    };
    /**
     * Creates a JSON notebook representation from the contents of a file.
     * @param {String} contents The contents of the file, as a string.
     * @return {Object} a JSON representation of the notebook.
         */
    exports.notebook_from_file_contents = function (contents) {
        var notebook = JSON.parse(contents);
        // bug in some case notebook where serialized twice.
        // make sure to re-deserialized, if once parse the notebook is still a
        // string.
        if (typeof (notebook) === "string") {
            console.warn("[notebook_model.ts] (╯°□°）╯︵ ┻━┻ :: Apparently Notebook has been serialized twice, deserializing a second time !");
            // here we need to cast notebook to <any> as otherwise compiler complain
            // that string/ notebook cannot be cast to each other.
            notebook = JSON.parse(notebook);
            console.warn("[notebook_model.ts] Double desirializing went ok.");
        }
        var unsplit_lines = function (multiline_string) {
            if (Array.isArray(multiline_string)) {
                return multiline_string.join('');
            }
            else {
                return multiline_string;
            }
        };
        transform_notebook(notebook, unsplit_lines);
        notebook.metadata = notebook.metadata || {};
        return notebook;
    };
    /**
     * Creates the contents of a file from a JSON notebook representation.
     * @param {Object} notebook a JSON representation of the notebook.
     * @return {Object} The JSON representation with lines split.
     */
    exports.notebook_json_contents_from_notebook = function (notebook) {
        if (typeof (notebook) == 'string') {
            var e = new Error("[notebook_model.ts] `file_contents_from_notebook`'s notebook is a string");
            console.error(e);
            throw e;
        }
        var notebook_copy = JSON.parse(JSON.stringify(notebook));
        var split_lines = function (obj) {
            if (typeof (obj) !== 'string') {
                return obj;
            }
            return obj.split('\n').map(function (line, idx, array) {
                if (idx == array.length - 1) {
                    return line;
                }
                else {
                    return line + '\n';
                }
            });
        };
        transform_notebook(notebook, split_lines);
        return notebook;
    };
    /**
     * Creates the contents of a file from a JSON notebook representation.
     * @param {Object} notebook a JSON representation of the notebook.
     * @return {String} The JSON representation with lines split.
     */
    exports.file_contents_from_notebook = function (notebook) {
        return JSON.stringify(exports.notebook_json_contents_from_notebook(notebook));
    };
    /**
     * Create a JSON representation of a new notebook
     * @param {string} name Notebook name
     * @return {Object} JSON representation of a new notebook.
     */
    exports.new_notebook = function () {
        return {
            'cells': [{
                    'cell_type': 'code',
                    'source': '',
                    'outputs': [],
                    'language': 'python',
                    'metadata': {}
                }],
            'metadata': {},
            'nbformat': 4,
            'nbformat_minor': 0
        };
    };
});

//# sourceMappingURL=notebook_model.js.map
