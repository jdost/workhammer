''' skills.py
This is a collection of functions that handle the creation, modification, and
updating of skills.  The skills are natural attributes of the player characters
that go up upon the completion of quests.
'''
from flask import request, session, redirect, url_for
from . import app, filter_keys, calc_level
from . import roles, logger, settings
from .decorators import datatype, require_permissions, cached, mark_dirty
from .classes import update_class
from .database import Skill, Player, errors
import httplib
# Keys that the user cannot directly changed (controlled by the app)
reserved_keys = ["created", "created_by", "modified", "modified_by"]


@app.route("/skill", methods=["POST"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def create_skill():
    ''' create_skill -> POST /skill
        POST: <JSON DATA>
    Submits a set of information to use in creating a skill
    '''
    if not request.json:
        return "POST body must be a JSON document for the skill to be made.", \
            httplib.BAD_REQUEST

    skill_info = request.json
    skill_info = filter_keys(skill_info, reserved_keys)

    if "formula" not in skill_info:
        skill_info["formula"] = settings.SKILL_DEFAULT["formula"]

    try:
        info, id = Skill.create(skill_info, session["id"])
        logger.info("Skill %s (%s) was created by user %s.", info["name"],
                    id, session["id"])
    except errors.MissingInfoError as err:
        logger.info(err)
        return "Packet missing required keys", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return info, httplib.CREATED


@app.endpoint("/skill", methods=["GET"])
@cached
@datatype
def skills():
    ''' skills -> GET /skill
    Returns a <list> of all of the quests currently stored in the database
    '''
    return Skill.all()


@app.route("/skill/<skill_id>", methods=["GET"])
@cached
@datatype
def get_skill(skill_id):
    ''' get_skill -> GET /skill/<skill_id>
    Returns the full description of the skill specified by <skill_id>.
    '''
    try:
        skill = Skill.get(skill_id)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Skill.", httplib.NOT_FOUND

    return skill


@app.route("/skill/<skill_id>", methods=["PUT"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def modify_skill(skill_id):
    ''' modify_skill -> PUT /skill/<skill_id>
        PUT: <JSON DATA>
    Submits a set of information to use to modify the skill specified by the
    <skill_id> parameter.
    '''
    if not request.json:
        return "PUT body must be a JSON document for the skill to be " + \
            "updated.", httplib.BAD_REQUEST

    skill_info = request.json
    skill_info['id'] = skill_id

    try:
        skill_info = Skill.modify(skill_info, session['id'])
        if not skill_info:
            return httplib.BAD_REQUEST
    except errors.NonMongoDocumentError as err:
        logger.info(err)
        return "Trying to modify a non existent skill", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return redirect(url_for('get_skill', skill_id=skill_id)) \
        if request.is_html else (skill_info, httplib.ACCEPTED)


@app.route("/skill/<skill_id>/leaders", methods=["GET"])
@datatype
def get_skill_leaders(skill_id):
    ''' get_skill_leaders -> GET /skill/<skill_id>/leaders
        GET: limit=<int>(optional)
    Retrieves the leader list for the skill specified by the <skill_id>
    parameter, will limit the result to the number specified by the limit GET
    param or 10 (default).
    '''
    limit = int(request.form.get("limit", "10"))

    try:
        players = Player.leaders(skill=skill_id, limit=limit)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Skill.", httplib.NOT_FOUND

    return players


def base_skill():
    ''' base_skill
    Returns the basic skill data structure, used for initializing a skill on a
    player.
    '''
    return {
        "points": 0,
        "level": 0
    }


def update_skill(player_mod, skill_id, points):
    ''' update_skill
    Helper function, takes a player modification dict (just holds the changes
    to a player not yet made).  Finds the skill based on the skill_id, updates
    the player's skill definition with the points and applies various changes
    per the skill being updated.

    ex. if the skill_id points to "Cooking", the player has 99 SP in the skill,
        and the points are 9.  The new SP for "Cooking" is now 108, the skill
        levels up every 100 SP, so they player would now have lvl 1 Cooking,
        giving them 15 XP.

    { "skills": { <Cooking>: { "points": 99, "level": 0 },
      "classes": { <Chef>: { "experience": 90, "level": 0 } }}
        becomes
    { "skills": { <Cooking>: { "points": 108, "level": 1 },
      "classes": { <Chef>: { "experience": 108, "level": 1 } }}
    '''
    try:
        skill = Skill.get(skill_id)
    except errors.NoEntryErr as err:
        logger.info(err)
        return player_mod

    player_skill = player_mod["skills"][skill_id] if \
        skill_id in player_mod["skills"] else base_skill()
    player_skill["points"] += points

    new_level = calc_level(skill['formula'], player_skill["points"],
                           player_skill["level"])

    if new_level > player_skill["level"]:
        change = new_level - player_skill["level"]
        player_skill["level"] += change
        player_mod = update_class(player_mod, skill, change)
        logger.info("Player leveled up skill %s to level %s.", skill_id,
                    player_skill["level"])

    player_mod["skills"][skill_id] = player_skill
    return player_mod
