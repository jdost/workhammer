from bson.objectid import ObjectId
from datetime import datetime
import rpg.database
from rpg.database import errors
from rpg import roles
database = rpg.database.collection("users")

roles_lookup = dict(
    map(lambda r: (getattr(roles, r), r),
        filter(lambda d: not d.startswith('__'), dir(roles)))
)


def __private_user(packet):
    ''' __private_user
    Helper function, takes the raw mongo user document and returns only the
    whitelisted (key, value) pairs that the user should see
    '''
    return {
        "username": packet["username"],
        "id": str(packet["_id"]),
        "role": map(lambda k: roles_lookup.get(k), packet["role"])
    }


def __public_user(packet):
    ''' __public_user
    Helper function, takes the raw mongo user document and returns only the
    whitelisted (key, value) pairs that should be publicly visible
    '''
    return {
        "username": packet["username"],
        "role": map(lambda k: roles_lookup.get(k), packet["role"])
    }


def create(info, role=[]):
    ''' User.create
    Tries to create an entry in the users table with the provided credentials,
    returns the user ID.
    '''
    if database.find_one({"username": info["username"]}):
        raise errors.ExistingUsernameError(
            "Username: {} already exists", info["username"])

    if type(role) is not list:
        role = [role]

    if database.count() == 0:
        role.append(roles.ROOT)

    info.update({
        'role': role,
        'created': datetime.utcnow(),
        'modified': None,
        'modified_by': None
    })

    id = database.insert(info)

    return id, role


def modify(info, user_id):
    ''' User.modify
    Takes a user packet and the current user's ID and updates the user packet
    in the database, the user's ID is used to note who modified the user.
    The current packet is retrieved from the database and updated with the
    passed in information and modification information, then saved.
    '''
    if 'id' not in info:
        raise errors.NonMongoDocumentError("User document lacks an index.")

    info['_id'] = ObjectId(info['id'])
    del info['id']

    user = database.find_one(info['_id'])
    user.update(info)
    user.update({
        'modified': datetime.utcnow(),
        'modified_by': ObjectId(user_id)
    })
    return database.save(user)


def login(username, pwhash):
    ''' User.login
    Tries to retrieve the user from the database using the provided credentials
    and returns the user's info packet and their private ID (used for with the
    session).  If it fails, the ID will be None.
    '''
    user = database.find_one({"username": username, "password": pwhash})
    return (__private_user(user), user['_id'], user['role']) if user \
        else (None, None, None)


def lookup(username=None, id=None):
    ''' User.lookup
    Retrieves the user info from the database using the provided identity
    information.  Takes either the user's ID or username, returns None if no
    User was found, otherwise returns the public packet.
    '''
    packet = None
    if username:
        packet = {"username": username}
    if id:
        packet = ObjectId(id)

    if not packet:
        return None

    user = database.find_one(packet)
    if user:
        user = __public_user(user)

    return user
