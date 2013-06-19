''' classes.py
This is a collection of functions that handle the creation and modification of
the class system.  Classes are a formulaic combination of skill progression
based on weighted bonus addition.  As classes level up (in a similar way to
how skills level up), the combined levels of all classes for a player
constitute the total level of the player.
'''
from flask import session, request, redirect, url_for
from . import app, filter_keys, calc_level
from . import roles, logger
from .decorators import datatype, require_permissions, cached, mark_dirty
from .database import Class, Player, errors
import httplib
# Keys that the user cannot directly change (controlled by the app)
reserved_keys = ["created", "created_by", "modified", "modified_by"]


@app.route("/class", methods=["POST"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def create_class():
    ''' create_class -> POST /class
        POST: <JSON DATA>
    Submits a set of information to use in creating a class
    '''
    if not request.json:
        return "POST body must be a JSON document for the class to be made.", \
            httplib.BAD_REQUEST

    class_info = request.json
    class_info = filter_keys(class_info, reserved_keys)

    try:
        info, id = Class.create(class_info, session["id"])
        logger.info("Class %s (%s) created by %s.", info["name"], info["id"],
                    session['id'])
    except errors.MissingInfoError as err:
        logger.info(err)
        return "Packet missing required keys", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return info, httplib.CREATED


@app.endpoint("/class", methods=["GET"])
@cached
@datatype
def classes():
    ''' classes -> GET /class
    Return a list of the available classes on the application.
    '''
    return Class.all()


@app.route("/class/<class_id>", methods=["GET"])
@cached
@datatype
def get_class(class_id):
    ''' get_class -> GET /class/<class_id>
    Returns the full description of the class specified by <class_id>.
    '''
    try:
        class_info = Class.get(class_id)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Class.", httplib.NOT_FOUND

    return class_info


@app.route("/class/<class_id>", methods=["PUT"])
@datatype
def modify_class(class_id):
    ''' modify_class -> PUT /class/<class_id>
        PUT: <JSON DATA>
    Submits a set of information to use to modify the class specified by the
    <class_id> parameter.
    '''
    if not request.json:
        return "PUT body must be a JSON document for the class to be " + \
            "updated.", httplib.BAD_REQUEST

    class_info = request.json
    class_info['id'] = class_id

    try:
        class_info = Class.modify(class_info, session['id'])
        if not class_info:
            return httplib.BAD_REQUEST
    except errors.NonMongoDocumentError as err:
        logger.info(err)
        return "Trying to modify a non existent class", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return redirect(url_for('get_class', class_id=class_id)) \
        if request.is_html else (class_info, httplib.ACCEPTED)


@app.route("/class/<class_id>/leaders", methods=["GET"])
@datatype
def get_class_leaders(class_id):
    ''' get_class_leaders -> GET /class/<class_id>/leaders
        GET: limit=<int>(optional)
    Retrieves the leader list for the class specified by the <class_id>
    parameter, will limit the result to the number specified by the limit GET
    param or 10 (default).
    '''
    limit = int(request.form.get("limit", "10"))

    try:
        players = Player.leaders(cls=class_id, limit=limit)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Class.", httplib.NOT_FOUND

    return players


def base_class():
    ''' base_class
    Returns a basic class data structure, used for initializing a class on a
    player.
    '''
    return {
        "points": 0.0,
        "level": 0
    }


def update_class(player_mod, skill, change=1):
    ''' update_class
    Helper function, takes a player modification dict (just holds the changes
    to a player not yet made).  Finds the classes to update based on the
    skill (this is the skill that levelled) and updates them for the player
    based on the weighting of the skill for the classes that utilize the skill
    in their level system.
    '''
    try:
        info = Class.by_skill(skill['id'])
    except errors.NoEntryError as err:
        logger.info(err)
        return player_mod

    print len(info)
    for cls in info:
        player_class = player_mod["classes"][cls['id']] if cls['id'] in \
            player_mod["classes"] else base_class()
        player_class["points"] += cls["skills"][skill["id"]] * change

        new_level = calc_level(cls["formula"], player_class["points"],
                               player_class["level"])

        if new_level > player_class["level"]:
            player_mod["level"] += new_level - player_class["level"]
            player_class["level"] = new_level

        player_mod["classes"][cls["id"]] = player_class

    return player_mod
