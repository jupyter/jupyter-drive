"""A contents manager that combine multiple content managers."""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

from IPython.html.services.contents.manager import ContentsManager
from IPython.html.services.contents.filemanager import FileContentsManager
from IPython.utils.traitlets import List
from .clientsidenbmanager import ClientSideContentsManager
from IPython.utils.importstring import import_item

class MixedContentsManager(ContentsManager):
    DRIVE_PATH_SENTINEL = 'gdrive'

    filesystem_scheme = List([
            {
                'root':'local',
                'contents':"IPython.html.services.contents.filemanager.FileContentsManager"
            },
            {
                'root': 'gdrive',
                'contents': 'jupyterdrive.clientsidenbmanager.ClientSideContentsManager'
            }
        ],
    help="""
    List of virtual mount point name and corresponding contents manager
    """)

    def __init__(self, **kwargs):
        kwargs.update({'parent':self})
        super(MixedContentsManager, self).__init__(**kwargs)
        self.managers = {}
        ## check consistency of scheme.
        if not len(set(map(lambda x:x['root'], self.filesystem_scheme))) == len(self.filesystem_scheme):
            raise ValueError('Scheme should not mount two contents manager on the same mountpoint')
        for scheme in self.filesystem_scheme:
            manager_class = import_item(scheme['contents'])
            self.managers[scheme['root']] = manager_class(**kwargs)

        self.file_contents_manager = FileContentsManager()
        self.client_side_contents_manager = ClientSideContentsManager()

    def is_drive_path(self, path):
        components = path.split('/');
        return components and components[0] == self.DRIVE_PATH_SENTINEL

    def path_dispatch1(method):
        def _wrapper_method(self, path, *args, **kwargs):
            path = path.strip('/')
            (sentinel, *_path) = path.split('/')
            man = self.managers.get(sentinel, None)
            if man is not None:
                meth = getattr(man, method.__name__)
                sub = meth('/'.join(_path), *args, **kwargs)
                print('path dispatching '+method.__name__+' on '+sentinel, sub)
                return sub
            else :
                print('not path dispatching <'+method.__name__+'> on <'+path+'>, know only about '+str(self.managers.keys()))
                return method(self, path, *args, **kwargs)
        return _wrapper_method

    def path_dispatch2(method):
        def _wrapper_method(self, other, path, *args, **kwargs):
            path = path.strip('/')
            (sentinel, *_path) = path.split('/')
            man = self.managers.get(sentinel, None)
            if man is not None:
                meth = getattr(man, method.__name__)
                sub = meth(other, '/'.join(_path), *args, **kwargs)
                print('path dispatching '+method.__name__+' on '+sentinel, sub)
                return sub
            else :
                print('not path dispatching <'+method.__name__+'> on <'+path+'>, know only about '+str(self.managers.keys()))
                return method(self, other, path, *args, **kwargs)
        return _wrapper_method

    # ContentsManager API part 1: methods that must be
    # implemented in subclasses.

    @path_dispatch1
    def dir_exists(self, path):
        ## root exists
        print('dir_exist', path)
        if path is '':
            return True
        if path in self.managers.keys():
            return True
        return False

    @path_dispatch1
    def is_hidden(self, path):
        if (path is '') or path in self.managers.keys():
            return False;
        raise NotImplementedError('....'+path)


    def file_exists(self, path=''):
        if self.is_drive_path(path):
            return self.client_side_contents_manager.file_exists(path)
        return self.file_contents_manager.file_exists(path)

    @path_dispatch1
    def exists(self, path):
        return self.file_contents_manager.exists(path)

    @path_dispatch1
    def get(self, path, **kwargs):
        pass

    @path_dispatch2
    def save(self, model, path):
        pass
        #return self.file_contents_manager.save(model, path)

    @path_dispatch2
    def update(self, model, path):
        return self.file_contents_manager.update(model, path)

    @path_dispatch1
    def delete(self, path):
        return self.file_contents_manager.delete(path)

    @path_dispatch1
    def create_checkpoint(self, path):
        return self.file_contents_manager.create_checkpoint(path)

    @path_dispatch1
    def list_checkpoints(self, path):
        return self.file_contents_manager.list_checkpoints(path)

    @path_dispatch2
    def restore_checkpoint(self, checkpoint_id, path):
        return self.file_contents_manager.restore_checkpoint(checkpoint_id, path)

    @path_dispatch2
    def delete_checkpoint(self, checkpoint_id, path):
        return self.file_contents_manager.delete_checkpoint(checkpoint_id, path)

    # ContentsManager API part 2: methods that have useable default
    # implementations, but can be overridden in subclasses.

    # TODO (route optional methods too)
