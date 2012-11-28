''' skills.py
This is a collection of functions that handle the creation, modification, and
updating of skills.  The skills are natural attributes of the player characters
that go up upon the completion of quests.
'''
from flask import request, session
from . import app, filter_keys
from . import roles, logger, settings
from .decorators import datatype, require_permissions
from .database import Skill, errors
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
    if "bonus" not in skill_info:
        skill_info["bonus"] = settings.SKILL_DEFAULT["bonus"]

    try:
        info, id = Skill.create(skill_info, session["id"])
        logger.info("Skill %s (%s) was created by user %s.", info["name"],
                    id, session["id"])
    except errors.MissingInfoError as err:
        logger.info(err)
        return "Packet missing required keys", httplib.BAD_REQUEST

    return info, httplib.CREATED


@app.endpoint("/skill", methods=["GET"])
@datatype("skills.html")
def skills():
    ''' skills -> GET /skill
    Returns a <list> of all of the quests currently stored in the database
    '''
    return Skill.all()


@app.route("/skill/<skill_id>", methods=["GET"])
@datatype("skill.html")
def get_skill(skill_id):
    ''' get_skill -> GET /skill/<skill_id>
    Returns the full description of the sill specified by <skill_id>.
    '''
    try:
        skill = Skill.get(skill_id)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Skill.", httplib.NOT_FOUND

    return skill


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
    to a player (not yet made).  Finds the skill based on the skill_id, updates
    the player's skill definition with the points and applies various changes
    per the skill being updated.

    ex. if the skill_id points to "Cooking", the player has 99 SP in the skill,
        and the points are 9.  The new SP for "Cooking" is now 108, the skill
        levels up every 100 SP, so they player would now have lvl 1 Cooking,
        giving them 15 XP.

    { "skills": { <Cooking>: { "points": 99, "level": 0 }, "experience": 0}
        becomes
    { "skills": { <Cooking>: { "points": 108, "level": 1 }, "experience": 15}
    '''
    try:
        skill = Skill.get(skill_id)
    except errors.NoEntryErr as err:
        logger.info(err)
        return player_mod

    player_skill = player_mod["skills"][skill_id] if \
        skill_id in player_mod["skills"] else base_skill()
    player_skill["points"] += points

    # TODO: handle if the points amount is greater than the space between the
    #   level, i.e. you have 10, you get 100 points, the levels are at 10*n,
    #   so your new points would be 110, which would be level 11 (this would
    #   set you at 2
    new_level = eval(skill['formula'], {"__builtins__": None},
                     {"n": player_skill["level"]}) <= player_skill["points"]

    if new_level:
        player_skill["level"] += 1
        player_mod["experience"] += skill["bonus"]
        logger.info("Player leveled up skill %s to level %s.", skill_id,
                    player_skill["level"])

    player_mod["skills"][skill_id] = player_skill
    return player_mod
