from flask import url_for
from datetime import datetime
from . import collection, ObjectId
from . import Player, Quest
database = collection("questlog")


def __clean(packet):
    ''' __clean
    Returns a clean version of the QuestLog entry
    '''
    return {
        'quest': {
            'id': str(packet['quest']),
            'url': url_for('get_quest', quest_id=str(packet['quest']))
        },
        'player': {
            'id': str(packet['player']),
            'url': url_for('get_player', player_id=str(packet['player']))
        },
        'status': packet['status'],
        'url': url_for('complete_quest', log_id=str(packet['_id'])),
        'completed': packet['created']
    }


def add(quest_id, player_id, user_id, status=0):
    ''' QuestLog::add
    Creates an entry in the QuestLog for the `player_id` completing the
    `quest_id`.  Uses the `user_id` to note who marked this Quest as being
    completed.  The `status` argument reflects the status of the quest being
    added to the table, used for tracking the status of the quest's progress.
    Returns the full Quest and Player documents (lookup was used to make sure
    the id's are existing entries).
    '''
    quest = Quest.get(quest_id)
    player = Player.get(player_id)

    id = database.insert({
        'quest': ObjectId(quest_id),
        'player': ObjectId(player_id),
        'created_by': ObjectId(user_id),
        'created': datetime.utcnow(),
        'status': status
    })

    return str(id), quest, player


def get(quest=None, player=None):
    ''' QuestLog::get
    Gets a <list> of the completions of either the quests (as specified with
    the `quest` argument) or by the player (as specified with the `player`
    argument).  Can have both and will return the completions of the specified
    quest by the specified player.
    '''
    if not quest and not player:  # return empty array if no filters given
        return []

    search = {}
    if quest:  # Add the quest parameter if set
        search["quest"] = ObjectId(quest)
    if player:  # Add the player parameter if set
        search["player"] = ObjectId(player)

    quests = database.find(search)

    return [__clean(q) for q in quests]


def uncompleted(player_id=None):
    ''' QuestLog::uncompleted
    Gets a <list> of the quests in the table that have not been completed (do
    not have a status of `0`).
    '''
    spec = {"status": {"$ne": 0}}
    if player_id:
        spec['player'] = ObjectId(player_id)

    quests = database.find(spec)

    return [__clean(q) for q in quests]


def update(request_id, status=0):
    ''' QuestLog::update
    Updates the `status` property of the QuestLog entry designated by the
    `request_id` argument.  If no status is provided, assumes the request is
    being marked as completed.  Returns the updated request upon success.
    '''
    request = database.find_one(ObjectId(request_id))
    request['status'] = status
    database.save(request)

    quest = Quest.get(request['quest'])
    player = Player.get(request['player'])

    return __clean(request), quest, player
