''' api.py
This is a collection of generic API functions, this mostly provides simple
things that don't really fall under other categories.  Helps flush out how the
API works and adds nice functionality and features to it.
'''
from flask import session
from . import app
from .decorators import datatype


@app.route('/', methods=['GET'])
@datatype("index.html")
def index():
    ''' index -> GET /
    Generates a dictionary of the various beginning endpoints for the
    application, used for discovery.  (Don't hardcode any of the endpoints
    in your API usage, use this packet to discover the API tree!)
    '''
    return dict(app.endpoints.items() + [("logged_in", session['id']
                if 'id' in session else None)])


@app.endpoint('/version')
@datatype
def version():
    ''' version -> * /version
    Returns the version number for the application.  Used for endpoints to be
    able to track errors.
    '''
    return app.__version__
