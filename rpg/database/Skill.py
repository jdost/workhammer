from datetime import datetime
from flask import url_for
from . import collection, has_keys, ObjectId, convert_id
from . import errors
database = collection("skills")

skill_keys = ["name", "formula"]


def __simple(packet):
    ''' __simple
    Returns a simple version of the Skill document
    '''
    return {
        "name": packet["name"],
        "id": str(packet["_id"]),
        "formula": packet["formula"],
        "url": url_for("get_skill", skill_id=str(packet["_id"]))
    }


def __complex(packet):
    ''' __complex
    Returns a more complex version of the Skill document (versus __simple)
    '''
    convert_id(packet)
    packet["url"] = url_for("get_skill", skill_id=packet["id"])
    packet["leaders"] = url_for("get_skill_leaders", skill_id=packet["id"])

    return packet


def create(info, user_id):
    ''' Skill::create
    Finishes creating the skill document (adds some built in pairs) and stores
    it in the database, the document passed in must include a set of keys (as
    specified in the `skill_keys` list, makes sure the skill model is
    consistent in some ways).  Returns the skill info and the id of the entry
    in the database.
    '''
    if not has_keys(info, skill_keys):
        raise errors.MissingInfoError(
            "Missing properties when creating a skill.")

    info.update({
        'created': datetime.utcnow(),
        'created_by': ObjectId(user_id),
        'modified': None,
        'modified_by': None
    })

    id = database.insert(info)
    info['_id'] = id

    return __complex(info), str(id)


def get(info):
    ''' Skill::get
    Retrieves a skill document from the database based on the argument.  The
    argument can either be an index of a document or a dictionary of
    information to filter with, expects only one document to be found.
    '''
    if type(info) is unicode or type(info) is str:
        # argument is a string, treat it like an ObjectId
        info = ObjectId(info)

    skill = database.find_one(info)
    if not skill:
        raise errors.NoEntryError(
            "Information provided to find a skill document did not find " +
            "anything.")
    return __complex(skill)


def all():
    ''' Skill::all
    Returns a <list> of all of the available skills
    '''
    return [__simple(skill) for skill in database.find()]


def modify(info, user_id):
    ''' Skill::modify
    Used on an existing skill, to modify/update the skill description in the
    database.
    '''
    if 'id' not in info:
        raise errors.NonMongoDocumentError(
            "Trying to modify a skill that is not in the database, use " +
            "the Skill::create function instead.")

    info['_id'] = ObjectId(info['id'])
    del info['id']

    skill = database.find_one(info['_id'])
    skill.update(info)
    skill.update({
        'modified': datetime.utcnow(),
        'modified_by': ObjectId(user_id)
    })

    return __complex(skill) if database.save(skill) else None
