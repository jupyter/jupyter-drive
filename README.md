# Google Drive support for Jupyter Notebook

This repository contains a custom Contents class that allows IPython to use Google Drive for file management.  The code is organized as a custom IPython profile.  To launch IPython with this profile, use the following command line (from the root of the repo)
```
IPYTHONDIR=. ipython notebook --profile=drive
```

You can also permanently link the `profile_drive` folder into your Jupyter/IPython profile directory, or recursively copy the
content into one of your vavorite profile. The configuration of IPython/Jupyter is done through the `.json` file in the profile
situated in the profile and will take precedence on configuration done in `.py` files, though you can still use non conflicting
options.
