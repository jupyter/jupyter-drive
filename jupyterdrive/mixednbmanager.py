"""A contents manager that combine multiple content managers."""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

from IPython.html.services.contents.manager import ContentsManager
from IPython.html.services.contents.filemanager import FileContentsManager
from .clientsidenbmanager import ClientSideContentsManager

class MixedContentsManager(ContentsManager):
    DRIVE_PATH_SENTINEL = 'gdrive'

    def __init__(self, **kwargs):
        self.file_contents_manager = FileContentsManager()
        self.client_side_contents_manager = ClientSideContentsManager()

    def is_drive_path(self, path):
        components = path.split('/');
        return components and components[0] == self.DRIVE_PATH_SENTINEL

    # ContentsManager API part 1: methods that must be
    # implemented in subclasses.

    def dir_exists(self, path):
        if self.is_drive_path(path):
            return self.client_side_contents_manager.dir_exists(path)
        return self.file_contents_manager.dir_exists(path)

    def is_hidden(self, path):
        if self.is_drive_path(path):
            return self.client_side_contents_manager.is_hidden(path)
        return self.file_contents_manager.is_hidden(path)

    def file_exists(self, path=''):
        if self.is_drive_path(path):
            return self.client_side_contents_manager.file_exists(path)
        return self.file_contents_manager.file_exists(path)

    def exists(self, path):
        return self.file_contents_manager.exists(path)

    def get(self, path, content=True, type_=None, format=None):
        return self.file_contents_manager.get(path, content=content, type_=type_, format=format)

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