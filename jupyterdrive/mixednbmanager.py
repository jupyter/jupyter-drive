"""A contents manager that combine multiple content managers."""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.
from .compat import JUPYTER

if JUPYTER:
    from notebook.services.contents.manager import ContentsManager
    from notebook.services.contents.filemanager import FileContentsManager
    from traitlets.traitlets import List
    from traitlets import import_item
else:
    from IPython.html.services.contents.manager import ContentsManager
    from IPython.html.services.contents.filemanager import FileContentsManager
    from IPython.utils.traitlets import List
    from IPython.utils.importstring import import_item

#make pyflakes happy
FileContentsManager

def _split_path(path):
    """split a path return by the api

    return
        - the sentinel:
        - the rest of the path as a list.
        - the original path stripped of / for normalisation.
    """
    path = path.strip('/')
    list_path = path.split('/')
    sentinel = list_path.pop(0)
    return sentinel, list_path, path


class MixedContentsManager(ContentsManager):

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
    """, config=True)

    def __init__(self, **kwargs):

        super(MixedContentsManager, self).__init__(**kwargs)
        self.managers = {}

        ## check consistency of scheme.
        if not len(set(map(lambda x:x['root'], self.filesystem_scheme))) == len(self.filesystem_scheme):
            raise ValueError('Scheme should not mount two contents manager on the same mountpoint')

        kwargs.update({'parent':self})
        for scheme in self.filesystem_scheme:
            manager_class = import_item(scheme['contents'])
            self.managers[scheme['root']] = manager_class(**kwargs)


    def path_dispatch1(method):
        def _wrapper_method(self, path, *args, **kwargs):
            sentinel, _path, path =  _split_path(path);
            man = self.managers.get(sentinel, None)
            if man is not None:
                meth = getattr(man, method.__name__)
                sub = meth('/'.join(_path), *args, **kwargs)
                return sub
            else :
                return method(self, path, *args, **kwargs)
        return _wrapper_method

    def path_dispatch2(method):
        def _wrapper_method(self, other, path, *args, **kwargs):
            sentinel, _path, path =  _split_path(path);
            man = self.managers.get(sentinel, None)
            if man is not None:
                meth = getattr(man, method.__name__)
                sub = meth(other, '/'.join(_path), *args, **kwargs)
                return sub
            else :
                return method(self, other, path, *args, **kwargs)
        return _wrapper_method

    def path_dispatch_kwarg(method):
        def _wrapper_method(self, path=''):
            sentinel, _path, path =  _split_path(path);
            man = self.managers.get(sentinel, None)
            if man is not None:
                meth = getattr(man, method.__name__)
                sub = meth(path='/'.join(_path))
                return sub
            else :
                return method(self, path=path)
        return _wrapper_method

    # ContentsManager API part 1: methods that must be
    # implemented in subclasses.

    @path_dispatch1
    def dir_exists(self, path):
        ## root exists
        if len(path) == 0:
            return True
        if path in self.managers.keys():
            return True
        return False

    @path_dispatch1
    def is_hidden(self, path):
        if (len(path) == 0) or path in self.managers.keys():
            return False;
        raise NotImplementedError('....'+path)

    @path_dispatch_kwarg
    def file_exists(self, path=''):
        if len(path) == 0:
            return False
        raise NotImplementedError('NotImplementedError')

    @path_dispatch1
    def exists(self, path):
        if len(path) == 0:
            return True
        raise NotImplementedError('NotImplementedError')

    @path_dispatch1
    def get(self, path, **kwargs):
        if len(path) == 0:
            return [ {'type':'directory'}]
        raise NotImplementedError('NotImplementedError')

    @path_dispatch2
    def save(self, model, path):
        raise NotImplementedError('NotImplementedError')

    def update(self, model, path):
        sentinel, listpath, path = _split_path(path)
        m_sentinel, m_listpath, orig_path =  _split_path(model['path'])
        if sentinel != m_sentinel:
            raise ValueError('Does not know how to move model across mountpoints')

        model['path'] = '/'.join(m_listpath)

        man = self.managers.get(sentinel, None)
        if man is not None:
            meth = getattr(man, 'update')
            sub = meth(model, '/'.join(listpath))
            return sub
        else :
            return self.method(model, path)


    @path_dispatch1
    def delete(self, path):
        raise NotImplementedError('NotImplementedError')

    @path_dispatch1
    def create_checkpoint(self, path):
        raise NotImplementedError('NotImplementedError')

    @path_dispatch1
    def list_checkpoints(self, path):
        raise NotImplementedError('NotImplementedError')

    @path_dispatch2
    def restore_checkpoint(self, checkpoint_id, path):
        raise NotImplementedError('NotImplementedError')

    @path_dispatch2
    def delete_checkpoint(self, checkpoint_id, path):
        raise NotImplementedError('NotImplementedError')

    # ContentsManager API part 2: methods that have useable default
    # implementations, but can be overridden in subclasses.

    # TODO (route optional methods too)

    ## Path dispatch on args 2 and 3 for rename.

    def path_dispatch_rename(rename_like_method):
        """
        decorator for rename-like function, that need dispatch on 2 arguments
        """

        def _wrapper_method(self, old_path, new_path):
            old_path, _old_path, old_sentinel =  _split_path(old_path);
            new_path, _new_path, new_sentinel =  _split_path(new_path);

            if old_sentinel != new_sentinel:
                raise ValueError('Does not know how to move things across contents manager mountpoints')
            else:
                sentinel = new_sentinel


            man = self.managers.get(sentinel, None)
            if man is not None:
                rename_meth = getattr(man, rename_like_method.__name__)
                sub = rename_meth('/'.join(_old_path), '/'.join(_new_path))
                return sub
            else :
                return rename_meth(self, old_path, new_path)
        return _wrapper_method

    @path_dispatch_rename
    def rename_file(self, old_path, new_path):
        """Rename a file."""
        raise NotImplementedError('must be implemented in a subclass')


    @path_dispatch_rename
    def rename(self, old_path, new_path):
        """Rename a file."""
        raise NotImplementedError('must be implemented in a subclass')

