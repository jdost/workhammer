import database
import settings
import hashlib
from importlib import import_module

__version__ = "0.2"
# List of the modules to import
__all__ = ["users", "players", "quests", "skills", "classes", "api"]


def cleanup():
    ''' cleanup:
    Helper function used for testing, cleans up the app's database and
    environment during a testing.
    '''
    from .decorators import cache
    cache.clear()
    database.cleanup()


def password_hash(password):
    ''' password_hash:
    Application wide hashing function for passwords, just salts and hashes the
    password and returns a hex representation of the hash.
    '''
    pwhash = hashlib.sha224(password)
    pwhash.update(settings.SECRET_KEY)
    return pwhash.hexdigest()


def filter_keys(src, blacklist):
    ''' filter_keys
    Helper function, removes the (key, value) pairs for keys in the blacklist
    list, returns filtered dictionary.
    '''
    for key in blacklist:
        if key in src:
            del src[key]

    return src


def calc_level(formula, xp, level=0):
    ''' calc_level
    Given a formula for the xp required for each level and the current xp,
    calculate the current level
    '''
    level_xp = 0
    while level_xp <= xp:
        level += 1
        temp = eval(formula, {"__builtins__": None},
                    {"n": level})
        if temp == level_xp:  # catches static formulas (i.e. f(n) = 100)
            return level - 1
        level_xp = temp

    return level - 1

# Webapp initialization
import session
from .decorators import RPGFlask

# RPGFlask is in decorators and is just an extended version of flask.Flask
app = RPGFlask(__name__)
app.session_interface = session.SessionHandler()
app.jinja_env.line_statement_prefix = '%'
app.debug = settings.DEBUG
app.__version__ = __version__
# This just imports all of the webapps modules (defined in __all__)
map(lambda module: import_module("." + module, __name__), __all__)
# This adds a helper function to templates for adding static URLs


@app.context_processor
def template_funcs():
    from flask import url_for
    from jinja2 import Markup

    def static(filename):
        return url_for('static', filename=filename)

    def style(stylename):
        if app.debug:
            filename = "less/{}.less".format(stylename)
            styletype = "stylesheet/less"
        else:
            filename = "css/{}.css".format(stylename)
            styletype = "stylesheet"

        return Markup("<link rel=\"{}\" type=\"text/css\" href=\"{}\">".format(
            styletype, static(filename)))
    return dict(static=static, style=style)
