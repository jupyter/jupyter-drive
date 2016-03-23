// AUTOMATICALY GENERATED FILE, see cooresponding .ts file
// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
//
define(["require", "exports", 'jquery', "base/js/utils"], function (require, exports, $, utils) {
    "use strict";
    /** Enum for object types */
    (function (ArgType) {
        ArgType[ArgType["PATH"] = 1] = "PATH";
        ArgType[ArgType["FILE"] = 2] = "FILE";
        ArgType[ArgType["LIST"] = 3] = "LIST";
        ArgType[ArgType["OTHER"] = 4] = "OTHER";
    })(exports.ArgType || (exports.ArgType = {}));
    var ArgType = exports.ArgType;
    ;
    var _default = { "schema": [
            {
                "root": "local",
                "stripjs": false,
                "contents": "services/contents"
            },
            {
                "root": "gdrive",
                "stripjs": true,
                "contents": "./drive-contents"
            }
        ]
    };
    var MixedContents = (function () {
        function MixedContents(options) {
            // Constructor
            //
            // A contentmanager handles passing file operations
            // to the back-end.  This includes checkpointing
            // with the normal file operations.
            //
            // Parameters:
            //  options: dictionary
            //      Dictionary of keyword arguments.
            //          base_url: string
            // Generate a map from root directories, to Contents instances.
            this._config = options.common_config;
            this._filesystem = this._config.loaded.then($.proxy(function () {
                var local_config = this._config.data['mixed_contents'];
                if (!local_config) {
                    this._config.update({ 'mixed_contents': _default });
                }
                var schema = (local_config || _default)['schema'];
                return Promise.all(schema.map(function (fs) {
                    return new Promise(function (resolve, reject) {
                        require([fs['contents']], function (contents) {
                            resolve({
                                'root': fs['root'],
                                'contents': new contents.Contents(options)
                            });
                        });
                    });
                })).then(function (filesystem_array) {
                    var filesystem = {};
                    filesystem_array.forEach(function (fs) {
                        filesystem[fs['root']] = fs['contents'];
                    });
                    return filesystem;
                });
            }, this));
        }
        /**
         * Generates the object that represents a filesystem
         * @param {Object} filesystem
         * @return {Object} An object representing a virtual directory.
         */
        MixedContents.prototype._virtual_fs_roots = function (filesystem) {
            return Object.keys(filesystem).map(function (root) {
                return {
                    type: 'directory',
                    name: root,
                    path: root,
                };
            });
        };
        /**
         * Routing functions
         */
        /**
         * Determine which Contents instance to use.
         * @param {Object} filesystem
         * @param {String} path The path to check.
         * @return {String} The root path for the contents instance.
         */
        MixedContents.prototype.get_fs_root = function (filesystem, path) {
            var components = path.split('/');
            if (components.length === 0) {
                return '';
            }
            if (filesystem[components[0]]) {
                return components[0];
            }
            return '';
        };
        /**
         * Convert a path from the virtual filesystem used by the front end, to the
         * concrete filesystem used by the Contents instance.
         * @param {String} root The root of the virtual mount point.
         * @param {String} path The path to convert.
         * @return {String} the converted path
         *
         */
        MixedContents.prototype.from_virtual_path = function (root, path, config) {
            var match_conf = config.filter(function (x) { return x.root == root; });
            if (match_conf[0].stripjs !== true) {
                return path;
            }
            return path.substr(root.length);
        };
        /**
         * Convert a path to the virtual filesystem used by the front end, from the
         * concrete filesystem used by the Contents instance.
         * @param {String} root The root of the virtual mount point.
         * @param {String} path The path to convert.
         * @return {String} the converted path
         *
         */
        MixedContents.prototype._to_virtual_path = function (root, path) {
            return utils.url_path_join(root, path);
        };
        /**
         * Takes a file model, and convert its path to the virtual filesystem.
         * from Google Drive format
         * @param {String} root The root of the virtual mount point.
         * @param {File} file The file model (this is modified by the function).
         * @return {File} the converted file model
         */
        MixedContents.prototype._to_virtual_file = function (root, file) {
            file['path'] = this._to_virtual_path(root, file['path']);
            ;
            return file;
        };
        /**
         * Takes a file list, and convert its path to the virtual filesystem.
         * from Google Drive format
         * @param {String} root The root of the virtual mount point.
         * @param {Object} list The file list (this is modified by the function).
         * @return {Object} The converted file list
         */
        MixedContents.prototype._to_virtual_list = function (root, list) {
            list['content'].forEach($.proxy(this._to_virtual_file, this, root));
            return list;
        };
        MixedContents.prototype._to_virtual = function (root, type, object) {
            if (type === ArgType.PATH) {
                return this._to_virtual_path(root, object);
            }
            else if (type === ArgType.FILE) {
                return this._to_virtual_file(root, object);
            }
            else if (type === ArgType.LIST) {
                return this._to_virtual_list(root, object);
            }
            else {
                return object;
            }
        };
        MixedContents.prototype.from_virtual = function (root, type, object, config) {
            if (type === ArgType.PATH) {
                return this.from_virtual_path(root, object, config);
            }
            else if (type === ArgType.FILE) {
                throw "from_virtual_file not implemented";
            }
            else if (type === ArgType.LIST) {
                throw "from_virtual_list not implemented";
            }
            else {
                return object;
            }
        };
        /**
         * Route a function to the appropriate content manager class
         * @param {string} method_name Name of the method being called
         * @param {Array} arg_types Types of the arguments to the function
         * @param {Array} return_types Type of the return value of the function
         * @param {Array} args the arguments to apply
         */
        MixedContents.prototype._route_function = function (method_name, arg_types, return_type, args) {
            var _this = this;
            return this._filesystem.then(function (filesystem) {
                if (arg_types.length == 0 || arg_types[0] != ArgType.PATH) {
                    // This should never happen since arg_types is hard coded below.
                    throw 'unexpected value of arg_types';
                }
                var root = _this.get_fs_root(filesystem, args[0]);
                if (root === '') {
                    if (method_name === 'list_contents') {
                        return { 'content': _this._virtual_fs_roots(filesystem) };
                    }
                    else {
                        throw 'true root directory only contains mount points.';
                    }
                }
                for (var i = 0; i < args.length; i++) {
                    args[i] = _this.from_virtual(root, arg_types[i], args[i], _this._config.data['mixed_contents']['schema']);
                }
                var contents = filesystem[root];
                return contents[method_name].apply(contents, args).then($.proxy(_this._to_virtual, _this, root, return_type));
            });
        };
        /**
         * File management functions
         */
        MixedContents.prototype.get = function (path, type, options) {
            return this._route_function('get', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.FILE, arguments);
        };
        MixedContents.prototype.new_untitled = function (path, options) {
            return this._route_function('new_untitled', [ArgType.PATH, ArgType.OTHER], ArgType.FILE, arguments);
        };
        MixedContents.prototype.delete = function (path) {
            return this._route_function('delete', [ArgType.PATH], ArgType.OTHER, arguments);
        };
        MixedContents.prototype.rename = function (path, new_path) {
            return this._route_function('rename', [ArgType.PATH, ArgType.PATH], ArgType.FILE, arguments);
        };
        MixedContents.prototype.save = function (path, model, options) {
            return this._route_function('save', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.FILE, arguments);
        };
        MixedContents.prototype.list_contents = function (path, options) {
            return this._route_function('list_contents', [ArgType.PATH, ArgType.OTHER], ArgType.LIST, arguments);
        };
        MixedContents.prototype.copy = function (from_file, to_dir) {
            return this._route_function('copy', [ArgType.PATH, ArgType.PATH], ArgType.FILE, arguments);
        };
        /**
         * Checkpointing Functions
         */
        MixedContents.prototype.create_checkpoint = function (path, options) {
            return this._route_function('create_checkpoint', [ArgType.PATH, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        MixedContents.prototype.restore_checkpoint = function (path, checkpoint_id, options) {
            return this._route_function('restore_checkpoint', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        MixedContents.prototype.list_checkpoints = function (path, options) {
            return this._route_function('list_checkpoints', [ArgType.PATH, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        return MixedContents;
    }());
    exports.MixedContents = MixedContents;
    exports.Contents = MixedContents;
});

//# sourceMappingURL=mixed-contents.js.map
