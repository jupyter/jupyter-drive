// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.
//
//
define(["require", "exports", 'jquery', "base/js/utils"], function (require, exports, $, utils) {
    /** Enum for object types */
    var ArgType = {
        PATH: 1,
        FILE: 2,
        LIST: 3,
        OTHER: 4
    };
    var _default = { "schema": [
        {
            "root": "local",
            "stripjs": false,
            "contents": "services/contents"
        },
        {
            "root": "gdrive",
            "stripjs": true,
            "contents": "nbextension/gdrive/drive-contents"
        }
    ] };
    var Contents = (function () {
        function Contents(options) {
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
            this.config = options.common_config;
            this.filesystem = this.config.loaded.then($.proxy(function () {
                var local_config = this.config.data['mixed_contents'];
                if (!local_config) {
                    this.config.update({ 'mixed_contents': _default });
                }
                var schema = (local_config || _default)['schema'];
                return Promise.all(schema.map(function (fs) {
                    console.log('fs:', fs, local_config);
                    return new Promise(function (resolve, reject) {
                        require([fs['contents']], function (contents) {
                            console.warn('contents module is:', contents, 'fs:', fs['contents']);
                            console.warn('Contents is:', contents.Contents);
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
        Contents.prototype.virtual_fs_roots = function (filesystem) {
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
        Contents.prototype.get_fs_root = function (filesystem, path) {
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
        Contents.prototype.from_virtual_path = function (root, path, config) {
            var match_conf = config.filter(function (x) {
                return x.root == root;
            });
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
        Contents.prototype.to_virtual_path = function (root, path) {
            return utils.url_path_join(root, path);
        };
        /**
         * Takes a file model, and convert its path to the virtual filesystem.
         * from Google Drive format
         * @param {String} root The root of the virtual mount point.
         * @param {File} file The file model (this is modified by the function).
         * @return {File} the converted file model
         */
        Contents.prototype.to_virtual_file = function (root, file) {
            file['path'] = this.to_virtual_path(root, file['path']);
            return file;
        };
        /**
         * Takes a file list, and convert its path to the virtual filesystem.
         * from Google Drive format
         * @param {String} root The root of the virtual mount point.
         * @param {Object} list The file list (this is modified by the function).
         * @return {Object} The converted file list
         */
        Contents.prototype.to_virtual_list = function (root, list) {
            list['content'].forEach($.proxy(this.to_virtual_file, this, root));
            return list;
        };
        Contents.prototype.to_virtual = function (root, type, object) {
            if (type === ArgType.PATH) {
                return this.to_virtual_path(root, object);
            }
            else if (type === ArgType.FILE) {
                return this.to_virtual_file(root, object);
            }
            else if (type === ArgType.LIST) {
                return this.to_virtual_list(root, object);
            }
            else {
                return object;
            }
        };
        Contents.prototype.from_virtual = function (root, type, object, config) {
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
        Contents.prototype.route_function = function (method_name, arg_types, return_type, args) {
            var _this = this;
            return this.filesystem.then(function (filesystem) {
                if (arg_types.length == 0 || arg_types[0] != ArgType.PATH) {
                    throw 'unexpected value of arg_types';
                }
                var root = _this.get_fs_root(filesystem, args[0]);
                if (root === '') {
                    if (method_name === 'list_contents') {
                        return { 'content': _this.virtual_fs_roots(filesystem) };
                    }
                    else {
                        throw 'true root directory only contains mount points.';
                    }
                }
                for (var i = 0; i < args.length; i++) {
                    args[i] = _this.from_virtual(root, arg_types[i], args[i], _this.config.data['mixed_contents']['schema']);
                }
                var contents = filesystem[root];
                return contents[method_name].apply(contents, args).then($.proxy(_this.to_virtual, _this, root, return_type));
            });
        };
        /**
         * File management functions
         */
        Contents.prototype.get = function (path, type, options) {
            return this.route_function('get', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.FILE, arguments);
        };
        Contents.prototype.new_untitled = function (path, options) {
            return this.route_function('new_untitled', [ArgType.PATH, ArgType.OTHER], ArgType.FILE, arguments);
        };
        Contents.prototype.delete = function (path) {
            return this.route_function('delete', [ArgType.PATH], ArgType.OTHER, arguments);
        };
        Contents.prototype.rename = function (path, new_path) {
            return this.route_function('rename', [ArgType.PATH, ArgType.PATH], ArgType.FILE, arguments);
        };
        Contents.prototype.save = function (path, model, options) {
            return this.route_function('save', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.FILE, arguments);
        };
        Contents.prototype.list_contents = function (path, options) {
            return this.route_function('list_contents', [ArgType.PATH, ArgType.OTHER], ArgType.LIST, arguments);
        };
        Contents.prototype.copy = function (from_file, to_dir) {
            return this.route_function('copy', [ArgType.PATH, ArgType.PATH], ArgType.FILE, arguments);
        };
        /**
         * Checkpointing Functions
         */
        Contents.prototype.create_checkpoint = function (path, options) {
            return this.route_function('create_checkpoint', [ArgType.PATH, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        Contents.prototype.restore_checkpoint = function (path, checkpoint_id, options) {
            return this.route_function('restore_checkpoint', [ArgType.PATH, ArgType.OTHER, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        Contents.prototype.list_checkpoints = function (path, options) {
            return this.route_function('list_checkpoints', [ArgType.PATH, ArgType.OTHER], ArgType.OTHER, arguments);
        };
        return Contents;
    })();
    exports.Contents = Contents;
});
