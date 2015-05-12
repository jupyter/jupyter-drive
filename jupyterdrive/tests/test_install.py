from __future__ import print_function, absolute_import


from jupyterdrive import deactivate, install



def test_a_install():
    install(verbose=True, mixed=True, user=True)

def test_b_deactivate():
    deactivate()

def test_c_deactivate_2():
    deactivate()

def test_d_install_normal():
    install(verbose=True, mixed=False, user=True)

def test_e_deactivate_3():
    deactivate()


