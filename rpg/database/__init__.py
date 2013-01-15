import pymongo as mongo
from bson.objectid import ObjectId as ObjectId_
from bson.errors import InvalidId
#import rpg.settings as settings
from .. import settings
from . import errors


connection_info = {
    'host': 'localhost',
    'port': 27017
}
connection_info.update(settings.MONGO_HOST)
connection = mongo.Connection(**connection_info)
if settings.DEBUG:
    database = connection.rpg_dev
else:
    database = connection.rpg


def cleanup():
    if settings.DEBUG:
        connection.drop_database("rpg_dev")


def collection(name):
    return database[name]


def has_keys(src, keys):
    ''' has_keys
    Checks that the <dict> src has all of the keys in keys
    '''
    return reduce(lambda a, b: a and b, map(lambda k: k in src, keys))


def ObjectId(src):
    ''' Wraps the ObjectId transform to throw local errors
    '''
    try:
        return ObjectId_(src)
    except InvalidId:
        #logger.info("User provided ID that wasn't an ObjectID: %s", src)
        raise errors.NoEntryError(
            "Information provided to find a document used an ID not from " +
            "the system.")


def convert_id(packet):
    ''' Converts the BSON ObjectId of a document into the nice string
    representation for the end user.
    '''
    packet["id"] = str(packet["_id"])
    del packet["_id"]
