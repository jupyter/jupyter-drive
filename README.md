# Google Drive support for Jupyter Notebook

This repository contains code and instructions for using Google Drive with Jupyter notebooks.  The code contains the JavaScript content manager that handles file management on the client side.  Instructions describe how to launch IPython using this content manager.

To use this code with IPython, use the custom profile provided, e.g. using the command line
```
IPYTHONDIR=. ipython notebook --profile=drive
```