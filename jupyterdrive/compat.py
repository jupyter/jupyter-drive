from __future__ import print_function, absolute_import 

try: 
    import  jupyter_notebook.nbextensions as nbe
    JUPYTER=True
except ImportError:
    import IPython.html.nbextensions as nbe
    JUPYTER=False

#silence pyflakes
nbe
