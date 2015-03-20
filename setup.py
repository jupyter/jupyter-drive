from setuptools import setup, find_packages  # Always prefer setuptools over distutils
from codecs import open  # To use a consistent encoding
from os import path

here = path.abspath(path.dirname(__file__))

# Get the long description from the relevant file
#with open(path.join(here, 'DESCRIPTION.rst'), encoding='utf-8') as f:
#    long_description = f.read()

setup(
    name='jupyterdrive',

    # Versions should comply with PEP440.  For a discussion on single-sourcing
    # the version across setup.py and the project code, see
    # https://packaging.python.org/en/latest/development.html#single-sourcing-the-version
    version='1.1.0',

    description='Integration of IPython/Jupyter with Google drive',
    long_description='',

    # The project's main homepage.
    url='https://github.com/jupyter/jupyter-drive',

    # Author details
    author='Matthias Bussonnier, Kester Tong, Kyle Kelley, Thomas Kluyver, The IPython team',
    author_email='ipython-dev@scipy.org',

    # Choose your license
    license='BSD',

    # See https://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        # How mature is this project? Common values are
        #   3 - Alpha
        #   4 - Beta
        #   5 - Production/Stable
        'Development Status :: 4 - Beta',

        # Indicate who your project is intended for
        'Intended Audience :: Developers',

        # Pick your license as you wish (should match "license" above)
        'License :: OSI Approved :: BSD License',

        # Specify the Python versions you support here. In particular, ensure
        # that you indicate whether you support Python 2, Python 3 or both.
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Framework :: IPython',
    ],

    # What does your project relate to?
    keywords='ipython jupyter google drive notebook',

    # You can just specify the packages manually here if your project is
# simple. Or you can use find_packages().
    packages=find_packages(exclude=['contrib', 'docs', 'tests*']),

    # List run-time dependencies here.  These will be installed by pip when your
    # project is installed. For an analysis of "install_requires" vs pip's
    # requirements files see:
    # https://packaging.python.org/en/latest/technical.html#install-requires-vs-requirements-files
    install_requires=['IPython'],


    # have to be included in MANIFEST.in as well.
    package_data={
        'jupyterdrive': [ '*.json',
                          '*.py',
                          'gdrive/*.js',
            ],
    },

)
