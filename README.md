# Google Drive support for Jupyter Notebook

This repository contains a custom
[Contents](https://github.com/ipython/ipython/blob/master/IPython/html/static/services/contents.js) class that allows IPython to use
Google Drive for file management.  The code is a organized as a python package
that contains functions to install a Jupyter notebook JavaScript extension,
and activate/deactivate different IPython profiles to be used with Google drive.

To install this package, clone this repository locally and run

```
pip install -e .
```

This will install the package in development mode with pip, which means that any
change you make to the repository will be reflected into the importable version
immediately.

To install the notebook extension and activate your profile with Google
Drive, run

```
python -m jupyterdrive <profilename>
```

If no profile name is given, Jupyter drive will install itself in the default profile.

Be sure that the profile exist before running the command. You can create a new profile with 

```
ipython profile create <profilename>
```

Please refer to IPython documentation for more info on profiles.

It is not yet possible to deactivate the drive integration automatically. But
you can get rid of `~/.ipython/profile_defaut/ipython_notebook_config.json`
config file to deactivate Google Drive as well as other config options.

The configuration of IPython/Jupyter is done through the `.json` file in the
profile situated in the profile and will take precedence on configuration done
in `.py` files, though you can still use non conflicting options.

Note that the `gdrive` folder is actually symlinked into nbextension while this
project is in developpement.


# First launch

On first launch, the application will ask you for the authorization to access
your files on Google Drive.  It only asks for permission to create new files or
 access files it has created or that you manually open with this application.
It also requires permission to access file/directory metadata, in order
to display the list of files/directories in the tree view.

The request pop-up looks like the following:

![](img/auth.png)

Clicking ok will open a Google Oauth pop-up.  You will see that the `Jupyter
Drive` application want access to some informations about your files. Keep that
in mind if you want to revoke access at a later point.

![](img/popup.png)

Once you click `Accept` you should be able to start creating new notebooks on
Google Drive, and open existing ones created by this application, and
view files/directories in the tree view.

