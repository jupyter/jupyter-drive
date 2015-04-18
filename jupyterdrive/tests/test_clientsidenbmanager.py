from jupyterdrive.clientsidenbmanager import ClientSideContentsManager
from jupyterdrive.mixednbmanager import MixedContentsManager
import inspect



def doesmatch(TheClass):
    """
    check wether all the methods of TheClass have the same signature 
    as in the base parent class to track potential regression, or evolution upstream


    """
    import sys 

    if sys.version_info.major < 3:
        return None
    S =  TheClass.__base__
    for meth_name in dir(TheClass):
        if not hasattr(S, meth_name):
            continue
        meth = getattr(TheClass, meth_name)
        if(callable(meth)):
            try:
                match =   (inspect.signature(meth) == inspect.signature(getattr(S,meth_name)))
                #assert(match)
                if not match:
                    print(meth_name, ' : does not match parent signature', inspect.signature(meth) , inspect.signature(getattr(S,meth_name)))
            except ValueError:
                pass



def test_1():
    doesmatch(ClientSideContentsManager)

def test_2():
    doesmatch(MixedContentsManager)
