from __future__ import print_function

import sys
import os
import json
import io


try :
    import  jupyter_notebook.nbextensions as nbe
    JUPYTER = True
except ImportError as e:
    import IPython.html.nbextensions as nbe
    JUPYTER = False



if JUPYTER:
    from IPython.paths import locate_profile
    from IPython.utils.py3compat import cast_unicode_py2
    from jupyter_core.paths import jupyter_config_dir
    from traitlets.config import Config, JSONFileConfigLoader, ConfigFileNotFound
else :
    from IPython.utils.path import locate_profile
    from IPython.utils.py3compat import cast_unicode_py2
    from IPython.config import Config, JSONFileConfigLoader, ConfigFileNotFound
    


def install(profile='default', symlink=True, mixed=False, user=False, prefix=None,
            verbose=False, path=None):
    dname = os.path.dirname(__file__)

    # might want to check if already installed and overwrite if exist
    if symlink and verbose:
        print('Will try symlink nbextension')
    if mixed and verbose:
        print('Will install mixed content manager')
    if prefix and verbose:
        print("I'll install in prefix:", prefix)
    nbe.install_nbextension(os.path.join(dname,'gdrive'),
                                symlink=symlink,
                                   user=user,
                                 prefix=prefix,
                                 nbextensions_dir=path)

    activate(profile, mixed=mixed)

def activate(profile=None, mixed=False):
    dname = os.path.dirname(__file__)
   
    if JUPYTER:
        pdir = jupyter_config_dir()
        cff_name = 'jupyter_notebook_config.json'
    else:
        pdir = locate_profile(profile)
        cff_name = 'ipython_notebook_config.json'

    jc = JSONFileConfigLoader(cff_name, pdir)



    try:
        config = jc.load_config();
    except (ConfigFileNotFound,ValueError):
        config = Config()
    if 'NotebookApp' in config:
        if ('tornado_settings' in config['NotebookApp']) or ('contents_manager_class' in config['NotebookApp']):
            # TODO, manually merge tornado setting if exist
            # but cannot do anything automatically if contents_manager_calss is set
            raise ValueError('You already got some configuration that will conflict with google drive. Bailin out')
    if mixed :
        drive_config  = JSONFileConfigLoader('mixed_contents.json', dname).load_config()
    else :
        drive_config  = JSONFileConfigLoader('jupyter_notebook_config.json', dname).load_config()
    config.merge(drive_config)
    if not JUPYTER:
        print('Activating Google Drive integration for profile "%s"' % profile)
    else:
        print('Activating Google Drive integration')
    config['format'] = 1

    with io.open(os.path.join(pdir,cff_name),'w', encoding='utf-8') as f:
        f.write(cast_unicode_py2(json.dumps(config, indent=2)))

def deactivate(profile):
    """should be a matter of just unsetting the above keys
    """

    raise NotImplemented('deactivating a profile is not yet implemented.')


def main(argv=None):
    import argparse
    prog = '{} -m jupyterdrive'.format(os.path.basename(sys.executable))
    parser = argparse.ArgumentParser(prog=prog,
                    description='Install Google Drive integration for Jupyter.')
    parser.add_argument("-m", "--mixed", help="Installed the mixed content manager",
                    action="store_true")
    parser.add_argument('profile', nargs='?', default=None, metavar=('<profile_name>'), help='profile name in which to install google drive integration for IPython 3.x')

    parser.add_argument("-S", "--no-symlink", help="do not symlink at install time",
                    action="store_false", dest='symlink', default=True)
    parser.add_argument("-u", "--user", help="force install in user land",
                    action="store_true")
    parser.add_argument("-p", "--prefix", help="Prefix where to install extension",
                    action='store', default=None)
    parser.add_argument("-P", "--path", help="explicit path on where to install the extension",
                    action='store', default=None)
    parser.add_argument("-v", "--verbose", help="increase verbosity",
                    action='store_true')
    args = parser.parse_args(argv)

    install(   path=args.path,
              mixed=args.mixed,
               user=args.user,
             prefix=args.prefix,
            profile=args.prefix,
            symlink=args.symlink,
            verbose=args.verbose
            )
