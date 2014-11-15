# Configuration file for ipython-notebook.

c = get_config()

#------------------------------------------------------------------------------
# Google Drive content manager
#------------------------------------------------------------------------------

c.NotebookApp.tornado_settings = {'contents_js_source': 'custom/drive-contents'}
c.NotebookApp.contents_manager_class = "IPython.html.services.contents.clientsidenbmanager.ClientSideContentsManager"
