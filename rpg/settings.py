''' settings.py
This is where all of the instance specific settings are controlled, you just
modify these values for your own needs.  Additional instance specific settings
can be added here.
'''
DEBUG = True  # change to False for a Prod environment, enables debug handlers
SESSION_KEY = "rpg_session"
MONGO_HOST = {
    "host": "localhost",  # Address of the machine hosting the service
    "port": 27017  # Port service is listening on (default: 27017)
}
DEFAULT_SESSION = {
}
STATIC = {  # settings for serving static files in debug mode
    "folder": "../static",  # serves the /lib folder in debug mode
    "path": "/s"  # static files are served under /s in debug mode
}
SKILL_DEFAULT = {  # default settings for quick skill creation
    "formula": "100*n"  # skills level at 100, 200, 300, etc
}
SERVING = {
    "host": "0.0.0.0",
    "port": 5000
}

# Generates the secret key
import os.path
import os
PROJ_ROOT = os.path.dirname(os.path.abspath(__file__))
__SECRET_FILE = os.path.join(os.path.normpath(PROJ_ROOT + "/.."), ".SECRET")

if not os.path.exists(__SECRET_FILE):
    __file = open(__SECRET_FILE, "w")
    __file.write(os.urandom(32).encode('base_64'))
    __file.close()

__file = open(__SECRET_FILE, "r")
SECRET_KEY = __file.read()
