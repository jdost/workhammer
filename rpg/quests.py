''' quests.py
This is a collection of functions that handle the creation, modification, and
completion of quests.  The quests are tasks that are performed that give
rewards to the player characters.  They can be defined, modified/tweaked, and
completed by players.
'''
from flask import session, request, redirect, url_for
from . import app, filter_keys
from . import roles, logger, skills
from .decorators import datatype, require_permissions, intersect, cached, \
    mark_dirty
from .database import Quest, QuestLog, errors, Player
import httplib
# Keys that the user cannot directly change (controlled by app)
reserved_keys = ["created", "created_by", "modified", "modified_by"]


@app.route("/quest", methods=["POST"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def create_quest():
    ''' create_quest -> POST /quest
        POST: <JSON DATA>
    Submits a set of information to use in creating a quest
    '''
    if not request.json:
        return "POST body must be a JSON document for the quest to be made.", \
            httplib.BAD_REQUEST

    quest_info = request.json
    quest_info = filter_keys(quest_info, reserved_keys)

    try:
        info, id = Quest.create(quest_info, session["id"])
        logger.info("Quest %s (%s) was created by user %s.", info["name"],
                    id, session["id"])
    except errors.MissingInfoError as err:
        logger.info(err)
        return "Packet missing required keys", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return info, httplib.CREATED


@app.route("/quest/<quest_id>", methods=["PUT"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def modify_quest(quest_id):
    ''' modify_quest -> PUT /quest/<quest_id>
        PUT: <JSON DATA>
    Submits a set of information to use to modify the quest specified by the
    <quest_id> parameter.
    '''
    if not request.json:
        return "PUT body must be a JSON document for the quest to be " + \
            "updated.", httplib.BAD_REQUEST

    quest_info = request.json
    quest_info['id'] = quest_id

    try:
        quest_info = Quest.modify(quest_info, session['id'])
        if not quest_info:
            return httplib.BAD_REQUEST
    except errors.NonMongoDocumentError as err:
        logger.info(err)
        return "Trying to modify a non existent skill", httplib.BAD_REQUEST

    mark_dirty(request.path)
    return redirect(url_for('get_quest', quest_id=quest_id)) \
        if request.is_html else (quest_info, httplib.ACCEPTED)


@app.endpoint("/quest", methods=["GET"])
@cached
@datatype
def quests():
    ''' quests -> GET /quest
    Returns a <list> of all of the quests currently stored in the database
    '''
    return Quest.all()


@app.route("/quest/<quest_id>", methods=["GET"])
@cached
@datatype
def get_quest(quest_id):
    ''' get_quest -> GET /quest/<quest_id>
    Returns the full description of the quest specified by <quest_id>, this
    includes all completions of the quest.
    '''
    try:
        quest = Quest.get(quest_id)
        quest["completions"] = QuestLog.get(quest=quest_id)
    except errors.NoEntryError as err:
        logger.info(err)
        return "The given ID was not found for the Quest.", httplib.NOT_FOUND

    return quest


@app.route("/quest/<quest_id>", methods=["POST"])
@app.route("/player/<player_id>", methods=["POST"])
@datatype
@require_permissions
def request_quest(player_id=None, quest_id=None):
    ''' complete_quest -> POST /quest/<quest_id>
            POST: player_id=[string](optional)&status=[integer](optional)
        complete_quest -> POST /player/<player_id>
            POST: quest_id=[string]&status=[integer](optional)
    Marks an attempt on a quest by a specified player.  If being done by a user
    with administrative permissions, can be marked as completed, if done by
    Stores that the specified player has completed the specified quest, will
    perform the updates to the Player based on the rewards of the completed
    quest.  This requires that the user performing this request has permissions
    to do so.
    '''
    player_id = request.form.get('player', player_id)
    quest_id = request.form.get('quest', quest_id)
    status = int(request.form.get('status', "1"))

    if status == 0 and not \
            intersect([roles.ROOT, roles.ADMIN], session['role']):
        status = 1  # only DM users can set completion

    if not player_id and roles.PLAYER in session['role']:
        player_id = session['player']
    if not quest_id and not player_id:
        return "Need both the player and quest to mark the completion.", \
            httplib.BAD_REQUEST

    try:
        id, quest, player = QuestLog.add(quest_id, player_id,
                                         session['id'], status)
        if status == 0:
            apply_quest(quest, player)
            logger.info("%s (%s) completed %s (%s), reported by %s",
                        player["name"], player["id"], quest["name"],
                        quest["id"], session["id"])
        else:
            logger.info("%s (%s) attempted %s (%s), reported by %s",
                        player["name"], player["id"], quest["name"],
                        quest["id"], session["id"])
    except errors.NoEntryError as err:
        logger.info(err)
        return "A given ID is not for an existing entry.", httplib.NOT_FOUND

    return httplib.ACCEPTED


@app.endpoint("/request/", methods=["GET"])
@app.route("/request/<player_id>", methods=["GET"])
@datatype
@require_permissions
def requests(player_id=None):
    ''' requests -> GET /request/
    Returns a list of the uncompleted quests, if the current user does not have
    administrative rights, will default to the current user's player.
    '''
    if not intersect([roles.ROOT, roles.ADMIN], session['role']):
        player_id = session['player']
    return QuestLog.uncompleted(player_id)


@app.route("/request/<log_id>", methods=["POST"])
@datatype
@require_permissions(roles.ROOT, roles.ADMIN)
def complete_quest(log_id):
    ''' complete_quest -> POST /request/<request_id>
            POST: state=[int]
    Stores that the specified quest request has been completed, will
    perform the updates to the Player based on the rewards of the completed
    quest.  This requires that the user performing this request has permissions
    to do so.
    '''
    try:
        log, quest, player = QuestLog.update(log_id)
        apply_quest(quest, player)
        logger.info("%s (%s) completed %s (%s), approved by %s",
                    player["name"], player["id"], quest["name"], quest["id"],
                    session["id"])
    except errors.NoEntryError as err:
        logger.info(err)
        return "A given ID is not for an existing entry.", httplib.NOT_FOUND

    return httplib.ACCEPTED


def apply_quest(quest, player):
    ''' apply_quest
    Helper function, takes a quest object and a player object.  Loops through
    the rewards from the quest and applies them to the player (gives them).

    Reward types:
      experience - added to the player's XP pool
      skills - loops through the set, adds new skills, updates existing ones
    '''
    modifications = {"id": player["id"], "experience": player["experience"]}
    if "skills" in quest["rewards"]:  # Handle skills
        modifications["skills"] = player["skills"]
        modifications["classes"] = player["classes"]
        modifications["level"] = player.get("level", 0)
        for (skill, points) in quest["rewards"]["skills"].items():
            modifications = skills.update_skill(modifications, skill, points)

    for (reward_type, reward) in quest["rewards"].items():
        if type(reward) is int:
            modifications[reward_type] = player[reward_type] + reward

    return Player.modify(modifications, session["id"])
