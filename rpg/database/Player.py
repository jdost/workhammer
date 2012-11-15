from bson.objectid import ObjectId
import rpg.database
from rpg.database import errors
database = rpg.database.collection("players")

player_keys = ["name"]


def has_keys(src, keys):
    ''' has_keys
    Checks that the <dict> src has all of the keys in keys
    '''
    return reduce(lambda a, b: a and b, map(lambda k: k in src, keys))


def create(info):
    ''' Player::create
    Used to create the player entry and store it in the database, the document
    passed in must include a specified set of keys (specified by `player_keys`,
    this is just a basic way of ensuring some consistency in a model.  Returns
    the player info and the id of the entry (or None if it failed)
    '''
    if not has_keys(info, player_keys):
        raise errors.MissingInfoError("Missing properties when creating a " + \
                "player.")

    return info, database.insert(info)


def get(info):
    ''' Player::get
    Retrieves a player document from the database based on the passed in
    packet.  The packet can either be the index or a dictionary of information
    to be used to filter, expects to only find one.
    '''
    if type(info) is str:  # if the argument is a string, treat like ObjectId
        info = ObjectId(info)

    player = database.find_one(info)
    if not player:
        raise errors.NoEntryError("Information provided to find a Player " + \
                "document did not find anything.")
    return player


def modify(info):
    ''' Player::modify
    Used on an existing player entry to modify/update the database document,
    used to save changes to the information for a player, such as name, exp,
    class, etc.
    '''
    if '_id' not in info:
        raise errors.NonMongoDocumentError("Trying to modify a Player that" + \
                " is not in the database, use Player::create instead.")
    return database.save(info)