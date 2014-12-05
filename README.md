# Google Drive support for Jupyter Notebook

This repository contains a custom Contents class that allows IPython to use
Google Drive for file management.  The code is a python package that has the
ability to install an Jupyter notebook JavaScript extension and
activate/deactivate different IPython profiles to be used with Google drive.

To install this package, close this repository locally and run

```
pip install -e .
```

This will install the package in development mode with pip, which mean that any
change you make to the repository will be reflected into the importable version
immediately.

To install the notebook extension and activate your default profile with Google
drive run :

```
python -m jupyterdrive
```

It is not yet possible to select another profile or deactivate the drive
integration automatically, But you can get rid of
`~/.ipython/profile_defaut/ipython_notebook_config.json` config file to
deactivate google drive as well as other config options.

The configuration of IPython/Jupyter is done through the `.json` file in the
profile situated in the profile and will take precedence on configuration done
in `.py` files, though you can still use non conflicting options.

Note that the `gdrive` folder is actually symlinked into nbextension while this
project is in developpement.


# First launch

On first launch the application will ask you for the authorisation to access
your google drive. it only ask for the permission to create new files or acess
the files it has created.

The request pop-up look like the following:

![](img/auth.png)

Clicking ok will open a google auth pop-up, you will see that the application
name appear to be `coLaboratory`. Keep that in mind if you want to revoke access
at a later point.

![](img/popup.png)

Once you click `Accept` you should be able to start creating new notebooks on
your google drive, and the the existing one created by this application

