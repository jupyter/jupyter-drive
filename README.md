# Google Drive support for Jupyter Notebook

This repository contains a custom Contents class that allows IPython to use Google Drive for file management.  The code is organized as a custom IPython profile.  To launch IPython with this profile, use the following command line (from the root of the repo)
```
IPYTHONDIR=. ipython notebook --profile=drive
```