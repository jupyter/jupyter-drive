
import IPython
import IPython.html.nbextensions as nbe
from IPython.utils.path import locate_profile


import sys
import os
import os.path
import json
import io

from IPython.config import Config, JSONFileConfigLoader, ConfigFileNotFound


def install(profile='default', symlink=True):
    dname = os.path.dirname(__file__)
    # miht want to check if already installed and overwrite if exist
    nbe.install_nbextension(os.path.join(dname,'gdrive'), symlink=symlink)
    activate(profile)

def activate(profile):
    dname = os.path.dirname(__file__)
    pdir = locate_profile(profile)

    jc = JSONFileConfigLoader('ipython_notebook_config.json',pdir)


    try:
        config = jc.load_config();
    except (ConfigFileNotFound,ValueError) as e:
        config = Config()
    if 'NotebookApp' in config:
        if ('tornado_settings' in config['NotebookApp']) or ('contents_manager_class' in config['NotebookApp']):
            # TODO, manually merge tornado settin if exist
            # but cannot do anythin automatically if contents_manager_calss is set
            raise ValueError('You already got some configuration that will conflict with google drive. Bailin out')

    drive_config  = JSONFileConfigLoader('ipython_notebook_config.json', dname).load_config()
    config.merge(drive_config)
    print(config)
    config['nbformat'] = 1

    with io.open(os.path.join(pdir,'ipython_notebook_config.json'),'wb') as f:
        json.dump(config,f, indent=2)

def deactivate(profile):
    """should be a matter of just unsetting the above keys
    """

    raise NotImplemented('deactivating a profile is not yet implemented.')




if __name__ == '__main__':
    """shoudl probably parse aruments of profiel and or activate deactivate"""
    install()
