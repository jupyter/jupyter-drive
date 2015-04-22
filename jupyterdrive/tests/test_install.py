from __future__ import print_function, absolute_import


from jupyterdrive import deactivate,install, activate



def test_install():
    install(verbose=True, mixed=True, user=True)

def test_deactivate():
    deactivate()

def test_deactivate_2():
    deactivate()

def test_install_normal():
    install(verbose=True, mixed=False, user=True)

def test_deactivate_2():
    deactivate()


