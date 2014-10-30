1# Configuration file for ipython-notebook.

c = get_config()

#------------------------------------------------------------------------------
# NotebookApp configuration
#------------------------------------------------------------------------------

# NotebookApp will inherit config from: BaseIPythonApplication, Application

# The number of additional ports to try if the specified port is not available.
# c.NotebookApp.port_retries = 50

# The url for MathJax.js.
# c.NotebookApp.mathjax_url = ''

# Supply extra arguments that will be passed to Jinja environment.
# c.NotebookApp.jinja_environment_options = {}

# The IP address the notebook server will listen on.
# c.NotebookApp.ip = 'localhost'

# DEPRECATED use base_url
# c.NotebookApp.base_project_url = '/'

# Create a massive crash report when IPython encounters what may be an internal
# error.  The default is to append a short message to the usual traceback
# c.NotebookApp.verbose_crash = False

# The random bytes used to secure cookies. By default this is a new random
# number every time you start the Notebook. Set it to a value in a config file
# to enable logins to persist across server sessions.
# 
# Note: Cookie secrets should be kept private, do not share config files with
# cookie_secret stored in plaintext (you can read the value from a file).
# c.NotebookApp.cookie_secret = ''

# The default URL to redirect to from `/`
# c.NotebookApp.default_url = '/tree'

# Whether to open in a browser after starting. The specific browser used is
# platform dependent and determined by the python standard library `webbrowser`
# module, unless it is overridden using the --browser (NotebookApp.browser)
# configuration option.
# c.NotebookApp.open_browser = True

# The date format used by logging formatters for %(asctime)s
# c.NotebookApp.log_datefmt = '%Y-%m-%d %H:%M:%S'

# The port the notebook server will listen on.
# c.NotebookApp.port = 8888

# Whether to overwrite existing config files when copying
# c.NotebookApp.overwrite = False

# Set the Access-Control-Allow-Origin header
# 
# Use '*' to allow any origin to access your server.
# 
# Takes precedence over allow_origin_pat.
# c.NotebookApp.allow_origin = ''

# The notebook manager class to use.
# c.NotebookApp.contents_manager_class = 'IPython.html.services.contents.filemanager.FileContentsManager'

# Use a regular expression for the Access-Control-Allow-Origin header
# 
# Requests from an origin matching the expression will get replies with:
# 
#     Access-Control-Allow-Origin: origin
# 
# where `origin` is the origin of the request.
# 
# Ignored if allow_origin is set.
# c.NotebookApp.allow_origin_pat = ''

# The full path to an SSL/TLS certificate file.
# c.NotebookApp.certfile = u''

# The base URL for the notebook server.
# 
# Leading and trailing slashes can be omitted, and will automatically be added.
# c.NotebookApp.base_url = '/'

# The session manager class to use.
# c.NotebookApp.session_manager_class = 'IPython.html.services.sessions.sessionmanager.SessionManager'

# Supply overrides for the tornado.web.Application that the IPython notebook
# uses.
# c.NotebookApp.tornado_settings = {}

# The directory to use for notebooks and kernels.
# c.NotebookApp.notebook_dir = u'/usr/local/google/home/kestert/iprepo/jupyter-drive/profile_drive'

# The kernel manager class to use.
# c.NotebookApp.kernel_manager_class = 'IPython.html.services.kernels.kernelmanager.MappingKernelManager'

# The file where the cookie secret is stored.
# c.NotebookApp.cookie_secret_file = u''

# 
# c.NotebookApp.file_to_run = ''

# The IPython profile to use.
# c.NotebookApp.profile = u'default'

# paths for Javascript extensions. By default, this is just
# IPYTHONDIR/nbextensions
# c.NotebookApp.nbextensions_path = []

# DISABLED: use %pylab or %matplotlib in the notebook to enable matplotlib.
# c.NotebookApp.pylab = 'disabled'

# Whether to enable MathJax for typesetting math/TeX
# 
# MathJax is the javascript library IPython uses to render math/LaTeX. It is
# very large, so you may want to disable it if you have a slow internet
# connection, or for offline use of the notebook.
# 
# When disabled, equations etc. will appear as their untransformed TeX source.
# c.NotebookApp.enable_mathjax = True

# The cluster manager class to use.
# c.NotebookApp.cluster_manager_class = 'IPython.html.services.clusters.clustermanager.ClusterManager'

# The base URL for websockets, if it differs from the HTTP server (hint: it
# almost certainly doesn't).
# 
# Should be in the form of an HTTP origin: ws[s]://hostname[:port]
# c.NotebookApp.websocket_url = ''

# The Logging format template
# c.NotebookApp.log_format = '[%(name)s]%(highlevel)s %(message)s'

# The name of the IPython directory. This directory is used for logging
# configuration (through profiles), history storage, etc. The default is usually
# $HOME/.ipython. This option can also be specified through the environment
# variable IPYTHONDIR.
# c.NotebookApp.ipython_dir = u''

# Set the log level by value or name.
# c.NotebookApp.log_level = 30

# Hashed password to use for web authentication.
# 
# To generate, type in a python/IPython shell:
# 
#   from IPython.lib import passwd; passwd()
# 
# The string should be of the form type:salt:hashed-password.
# c.NotebookApp.password = u''

# Set the Access-Control-Allow-Credentials: true header
# c.NotebookApp.allow_credentials = False

# Path to an extra config file to load.
# 
# If specified, load this config file in addition to any other IPython config.
# c.NotebookApp.extra_config_file = u''

# Extra paths to search for serving static files.
# 
# This allows adding javascript/css to be available from the notebook server
# machine, or overriding individual files in the IPython
# c.NotebookApp.extra_static_paths = []

# Whether to trust or not X-Scheme/X-Forwarded-Proto and X-Real-Ip/X-Forwarded-
# For headerssent by the upstream reverse proxy. Necessary if the proxy handles
# SSL
# c.NotebookApp.trust_xheaders = False

# Whether to install the default config files into the profile dir. If a new
# profile is being created, and IPython contains config files for that profile,
# then they will be staged into the new directory.  Otherwise, default config
# files will be automatically generated.
# c.NotebookApp.copy_config_files = False

# The full path to a private key file for usage with SSL/TLS.
# c.NotebookApp.keyfile = u''

# DEPRECATED, use tornado_settings
# c.NotebookApp.webapp_settings = {}

# Specify what command to use to invoke a web browser when opening the notebook.
# If not specified, the default browser will be determined by the `webbrowser`
# standard library module, which allows setting of the BROWSER environment
# variable to override it.
# c.NotebookApp.browser = u''

#------------------------------------------------------------------------------
# KernelManager configuration
#------------------------------------------------------------------------------

# Manages a single kernel in a subprocess on this host.
# 
# This version starts kernels with Popen.

# KernelManager will inherit config from: ConnectionFileMixin

# DEPRECATED: Use kernel_name instead.
# 
# The Popen Command to launch the kernel. Override this if you have a custom
# kernel. If kernel_cmd is specified in a configuration file, IPython does not
# pass any arguments to the kernel, because it cannot make any assumptions about
# the  arguments that the kernel understands. In particular, this means that the
# kernel does not receive the option --debug if it given on the IPython command
# line.
# c.KernelManager.kernel_cmd = []

# Should we autorestart the kernel if it dies.
# c.KernelManager.autorestart = False

# set the stdin (ROUTER) port [default: random]
# c.KernelManager.stdin_port = 0

# Set the kernel's IP address [default localhost]. If the IP address is
# something other than localhost, then Consoles on other machines will be able
# to connect to the Kernel, so be careful!
# c.KernelManager.ip = u''

# JSON file in which to store connection info [default: kernel-<pid>.json]
# 
# This file will contain the IP, ports, and authentication key needed to connect
# clients to this kernel. By default, this file will be created in the security
# dir of the current profile, but can be specified by absolute path.
# c.KernelManager.connection_file = ''

# set the control (ROUTER) port [default: random]
# c.KernelManager.control_port = 0

# set the heartbeat port [default: random]
# c.KernelManager.hb_port = 0

# set the shell (ROUTER) port [default: random]
# c.KernelManager.shell_port = 0

# 
# c.KernelManager.transport = 'tcp'

# set the iopub (PUB) port [default: random]
# c.KernelManager.iopub_port = 0

#------------------------------------------------------------------------------
# ProfileDir configuration
#------------------------------------------------------------------------------

# An object to manage the profile directory and its resources.
# 
# The profile directory is used by all IPython applications, to manage
# configuration, logging and security.
# 
# This object knows how to find, create and manage these directories. This
# should be used by any code that wants to handle profiles.

# Set the profile location directly. This overrides the logic used by the
# `profile` option.
# c.ProfileDir.location = u''

#------------------------------------------------------------------------------
# Session configuration
#------------------------------------------------------------------------------

# Object for handling serialization and sending of messages.
# 
# The Session object handles building messages and sending them with ZMQ sockets
# or ZMQStream objects.  Objects can communicate with each other over the
# network via Session objects, and only need to work with the dict-based IPython
# message spec. The Session will handle serialization/deserialization, security,
# and metadata.
# 
# Sessions support configurable serialization via packer/unpacker traits, and
# signing with HMAC digests via the key/keyfile traits.
# 
# Parameters ----------
# 
# debug : bool
#     whether to trigger extra debugging statements
# packer/unpacker : str : 'json', 'pickle' or import_string
#     importstrings for methods to serialize message parts.  If just
#     'json' or 'pickle', predefined JSON and pickle packers will be used.
#     Otherwise, the entire importstring must be used.
# 
#     The functions must accept at least valid JSON input, and output *bytes*.
# 
#     For example, to use msgpack:
#     packer = 'msgpack.packb', unpacker='msgpack.unpackb'
# pack/unpack : callables
#     You can also set the pack/unpack callables for serialization directly.
# session : bytes
#     the ID of this Session object.  The default is to generate a new UUID.
# username : unicode
#     username added to message headers.  The default is to ask the OS.
# key : bytes
#     The key used to initialize an HMAC signature.  If unset, messages
#     will not be signed or checked.
# keyfile : filepath
#     The file containing a key.  If this is set, `key` will be initialized
#     to the contents of the file.

# Username for the Session. Default is your system username.
# c.Session.username = u'kestert'

# The name of the unpacker for unserializing messages. Only used with custom
# functions for `packer`.
# c.Session.unpacker = 'json'

# Threshold (in bytes) beyond which a buffer should be sent without copying.
# c.Session.copy_threshold = 65536

# The name of the packer for serializing messages. Should be one of 'json',
# 'pickle', or an import name for a custom callable serializer.
# c.Session.packer = 'json'

# The maximum number of digests to remember.
# 
# The digest history will be culled when it exceeds this value.
# c.Session.digest_history_size = 65536

# The UUID identifying this session.
# c.Session.session = u''

# The digest scheme used to construct the message signatures. Must have the form
# 'hmac-HASH'.
# c.Session.signature_scheme = 'hmac-sha256'

# execution key, for extra authentication.
# c.Session.key = ''

# Debug output in the Session
# c.Session.debug = False

# The maximum number of items for a container to be introspected for custom
# serialization. Containers larger than this are pickled outright.
# c.Session.item_threshold = 64

# path to file containing execution key.
# c.Session.keyfile = ''

# Threshold (in bytes) beyond which an object's buffer should be extracted to
# avoid pickling.
# c.Session.buffer_threshold = 1024

# Metadata dictionary, which serves as the default top-level metadata dict for
# each message.
# c.Session.metadata = {}

#------------------------------------------------------------------------------
# MappingKernelManager configuration
#------------------------------------------------------------------------------

# A KernelManager that handles notebook mapping and HTTP error handling

# MappingKernelManager will inherit config from: MultiKernelManager

# The name of the default kernel to start
# c.MappingKernelManager.default_kernel_name = 'python2'

# 
# c.MappingKernelManager.root_dir = u'/usr/local/google/home/kestert/iprepo/jupyter-drive/profile_drive'

# The kernel manager class.  This is configurable to allow subclassing of the
# KernelManager for customized behavior.
# c.MappingKernelManager.kernel_manager_class = 'IPython.kernel.ioloop.IOLoopKernelManager'

#------------------------------------------------------------------------------
# ContentsManager configuration
#------------------------------------------------------------------------------

# Base class for serving files and directories.
# 
# This serves any text or binary file, as well as directories, with special
# handling for JSON notebook documents.
# 
# Most APIs take a path argument, which is always an API-style unicode path, and
# always refers to a directory.
# 
# - unicode, not url-escaped
# - '/'-separated
# - leading and trailing '/' will be stripped
# - if unspecified, path defaults to '',
#   indicating the root path.
# 
# name is also unicode, and refers to a specfic target:
# 
# - unicode, not url-escaped
# - must not contain '/'
# - It refers to an individual filename
# - It may refer to a directory name,
#   in the case of listing or creating directories.

# Glob patterns to hide in file and directory listings.
# c.ContentsManager.hide_globs = [u'__pycache__', '*.pyc', '*.pyo', '.DS_Store', '*.so', '*.dylib', '*~']

# The base name used when creating untitled notebooks.
# c.ContentsManager.untitled_notebook = 'Untitled'

# The base name used when creating untitled directories.
# c.ContentsManager.untitled_directory = 'Untitled Folder'

# The base name used when creating untitled files.
# c.ContentsManager.untitled_file = 'untitled'

#------------------------------------------------------------------------------
# FileContentsManager configuration
#------------------------------------------------------------------------------

# FileContentsManager will inherit config from: ContentsManager

# 
# c.FileContentsManager.root_dir = u'/usr/local/google/home/kestert/iprepo/jupyter-drive/profile_drive'

# The base name used when creating untitled files.
# c.FileContentsManager.untitled_file = 'untitled'

# Glob patterns to hide in file and directory listings.
# c.FileContentsManager.hide_globs = [u'__pycache__', '*.pyc', '*.pyo', '.DS_Store', '*.so', '*.dylib', '*~']

# The base name used when creating untitled notebooks.
# c.FileContentsManager.untitled_notebook = 'Untitled'

# The base name used when creating untitled directories.
# c.FileContentsManager.untitled_directory = 'Untitled Folder'

# The directory name in which to keep file checkpoints
# 
# This is a path relative to the file's own directory.
# 
# By default, it is .ipynb_checkpoints
# c.FileContentsManager.checkpoint_dir = '.ipynb_checkpoints'

# DEPRECATED, IGNORED
# c.FileContentsManager.save_script = False

#------------------------------------------------------------------------------
# NotebookNotary configuration
#------------------------------------------------------------------------------

# A class for computing and verifying notebook signatures.

# The secret key with which notebooks are signed.
# c.NotebookNotary.secret = ''

# The file where the secret key is stored.
# c.NotebookNotary.secret_file = u''

# The hashing algorithm used to sign notebooks.
# c.NotebookNotary.algorithm = 'sha256'

#------------------------------------------------------------------------------
# Google Drive content manager
#------------------------------------------------------------------------------

c.NotebookApp.tornado_settings = {'contents_js_source': 'custom/drive-contents'}
c.NotebookApp.contents_manager_class = "IPython.html.services.contents.clientsidenbmanager.ClientSideContentsManager"
