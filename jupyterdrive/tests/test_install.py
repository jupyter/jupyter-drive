from __future__ import print_function, absolute_import


from jupyterdrive import install



def test_install():
    install(verbose=True, mixed=True, user=True)

