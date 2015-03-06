from jupyterdrive.clientsidenbmanager import ClientSideContentsManager
from jupyterdrive.mixednbmanager import MixedContentsManager
import inspect



def doesmatch(TheClass):
    """
    check wether all the methods of TheClass have the same signature 
    as in the base parent class to track potential regression, or evolution upstream


    """
    S =  TheClass.__base__
    for meth_name in dir(TheClass):
        if not hasattr(S, meth_name):
            continue
        meth = getattr(TheClass, meth_name)
        if(callable(meth)):
            try:
                match =   (inspect.signature(meth) == inspect.signature(getattr(S,meth_name)))
                if not match:
                    print(meth_name, ' : does not match parent signature', inspect.signature(meth) , inspect.signature(getattr(S,meth_name)))
            except ValueError:
                pass




doesmatch(ClientSideContentsManager)
doesmatch(MixedContentsManager)
