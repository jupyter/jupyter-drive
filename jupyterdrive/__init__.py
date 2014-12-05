
import IPython
import IPython.html.nbextensions as nbe


import sys
import os
import os.path


def install(profile='default', symlink=False):
    dname = os.path.dirname(__file__)
    nbe.install_nbextension(os.path.join(dname,'gdrive'), symlink=symlink)


if __name__ == '__main__':
    install()
