from datetime import datetime
from flask import url_for
from . import collection, has_keys, ObjectId, convert_id
from . import errors
database = collection("classes")

class_keys = ["name", "formula"]


def __simple(packet):
    ''' __simple
    Returns a simple verion of the Class document
    '''
    return {
        "name": packet["name"],
        "url": url_for("get_class", class_id=str(packet["_id"]))
    }


def __complex(packet):
    ''' __complex
    Returns a more complex version of the Class document (versus __simple)
    '''
    convert_id(packet)
    packet["url"] = url_for("get_class", class_id=packet["id"])
    packet["leaders"] = url_for("get_class_leaders", class_id=packet["id"])

    return packet


def create(info, user_id):
    ''' Class::create
    Finishes creating the class document (adds some built in pairs) and stores
    it in the database, the document passed in must include a set of keys (as
    specified in the `class_keys` list, makes sure the class model is
    consistent in some ways).  Returns the class info and the id of the entry
    in the database.
    '''
    if not has_keys(info, class_keys):
        raise errors.MissingInfoError(
            "Missing properties when creating a class.")

    if 'skills' not in info:
        info['skills'] = {}

    info.update({
        'created': datetime.utcnow(),
        'created_by': ObjectId(user_id),
        'modified': None,
        'modified_by': None
    })

    id = database.insert(info)
    info['_id'] = id

    return __complex(info), str(id)


def all():
    ''' Class::all
    Returns a <list> of all of the available classes
    '''
    return [__simple(cls) for cls in database.find()]


def get(class_id):
    ''' Class::get
    Retrieves a class document from the database based on the argument.  The
    argument should be the id of the document to retrieve.
    '''
    class_id = ObjectId(class_id)
    class_info = database.find_one(class_id)
    if not class_info:
        raise errors.NoEntryError(
            "ID provided to find a class document did not find anything.")

    return __complex(class_info)


def by_skill(skill_id):
    ''' Class::by_skill
    Retrieves a <list> of class documents from the database where all of the
    returned classes take the specified skill (based on the skill_id) is taken
    into account in advancing the class.
    '''
    query = {"skills." + skill_id: {"$exists": True}}
    print query
    class_set = database.find(query)
    return [__complex(cls) for cls in class_set]


def modify(info, user_id):
    ''' Class::modify
    Used on an existing class, to modify/update the class description in the
    database.
    '''
    if 'id' not in info:
        raise errors.NonMongoDocumentError(
            "Trying to modify a class that is not in the databse, use " +
            "the Class::create function instead.")

    info['_id'] = ObjectId(info['id'])
    del info['id']

    class_info = database.find_one(info['_id'])
    class_info.update(info)
    class_info.update({
        'modified': datetime.utcnow(),
        'modified_by': ObjectId(user_id)
    })

    return __complex(class_info) if database.save(class_info) else None
