"""A contents manager that combine multiple content managers."""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

from IPython.html.services.contents.manager import ContentsManager
from IPython.html.services.contents.filemanager import FileContentsManager

class MixedContentsManager(ContentsManager):
    """Content manager that mixes regular IPython content manager with Drive

    For paths that do not start with gdrive/, this calls the regular IPython
    content manager.  But for paths that start with gdrive/, it acts as a
    minimal implementation, which implements the few methods that are still
    required on the server side when using the Google Drive Contents class
    on the JavaScript side.

    The view handlers for notebooks and directories (/tree/) check with the
    ContentsManager that their target exists so they can return 404 if not.
    Using this class as the contents manager allows those pages to render
    when the file is on Google Drive, and so the IPython server can't know about
    whether the file exists or not.
    """

    DRIVE_PATH_SENTINEL = 'gdrive'

    def __init__(self, **kwargs):
        self.file_contents_manager = FileContentsManager()

    def is_drive_path(self, path):
        components = path.split('/');
        return components and components[0] == self.DRIVE_PATH_SENTINEL

    # ContentsManager API part 1: methods that must be
    # implemented in subclasses.

    def dir_exists(self, path):
        if self.is_drive_path(path):
            return True
        return self.file_contents_manager.dir_exists(path)

    def is_hidden(self, path):
        if self.is_drive_path(path):
            return False
        return self.file_contents_manager.is_hidden(path)

    def file_exists(self, path=''):
        if self.is_drive_path(path):
            return True
        return self.file_contents_manager.file_exists(path)

    def exists(self, path):
        return self.file_contents_manager.exists(path)

    def get(self, path, **kwargs):
        if self.is_drive_path(path):
            return {'type':'notebook'}
        return self.file_contents_manager.get(path, **kwargs)

    def save(self, model, path):
        return self.file_contents_manager.save(model, path)

    def update(self, model, path):
        return self.file_contents_manager.update(model, path)

    def delete(self, path):
        return self.file_contents_manager.delete(path)

    def create_checkpoint(self, path):
        return self.file_contents_manager.create_checkpoint(path)

    def list_checkpoints(self, path):
        return self.file_contents_manager.list_checkpoints(path)

    def restore_checkpoint(self, checkpoint_id, path):
        return self.file_contents_manager.restore_checkpoint(checkpoint_id, path)

    def delete_checkpoint(self, checkpoint_id, path):
        return self.file_contents_manager.delete_checkpoint(checkpoint_id, path)

    # ContentsManager API part 2: methods that have useable default
    # implementations, but can be overridden in subclasses.

    # TODO (route optional methods too)