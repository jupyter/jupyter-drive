declare module "base/js/namespace" {
    module Contents {
    }
}

declare module "base/js/utils"{
    function url_path_join(root:string, path:string):string;
}

declare module "base/js/dialog" {}

declare module "drive_utils" {
    export var NOTEBOOK_MIMETYPE:any;
    export var FOLDER_MIME_TYPE:any;
    export var set_user_info:any;
}

declare module "gapi_utils" {
    function gapi_ready()
    function execute()
    function upload_to_drive()
    export var config
}
