from base import TestBase
#from unittest import skip
import json
import httplib


class QuestTest(TestBase):
    ''' QuestTest
    Test suite to test the question system, including creating quest(s) and
    players completing the quest(s).
    '''

    player = {
        "name": "Megatron"
    }

    root_user = {
        "username": "dungeon_master",
        "password": "blah blah password security"
    }

    quest = {
        "name": "Test Quest",
        "description": "Just a quest for testing",
        "rewards": {
            "experience": 5
        }
    }

    def setUp(self):
        ''' QuestTest::setUp
        Overloaded setup call, this is responsible for creating a root user by
        default.  Mostly useful because of the requirement of a DM user for
        most of the tests.
        '''
        TestBase.setUp(self)
        self.register(self.root_user)

    def get_quest_list(self):
        ''' QuestTest::get_quest_list
        '''
        response = self.app.get(self.endpoints["quests"]["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        return json.loads(response.data)

    def test_create_basic_quest(self):
        ''' Tests creating just a basic quest
        Creates a basic quest (just rewards basic experience).
        '''
        quest = self.create_quest(self.quest)
        response = self.app.get(quest["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)

        quests = self.get_quest_list()
        self.assertEqual(1, len(quests))

    def test_create_bad_quest(self):
        ''' Tests creating a quest with missing information
        '''
        quest = self.quest.copy()
        del quest["name"]
        response = self.app.post(self.endpoints["quests"]["url"],
                                 data=json.dumps(quest),
                                 content_type="application/json",
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    def test_retrieve_bad_quest(self):
        ''' Tests trying to retrieve a nonexistant quest
        '''
        response = self.app.get(self.endpoints["quests"]["url"] + "/1",
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.NOT_FOUND)

    def test_apply_basic_quest_as_quest(self):
        ''' Test creating a basic quest and applying it as quest
        Creates a basic quest, then creates a new player and has the player
        complete this quest.  Makes sure the rewards of the quest get applied.
        This uses the quest route to completing the quest.
        '''
        self.assertTrue(self.logout(), "Logout failed.")

        response = self.register({
            "username": "Quester",
            "password": "QuestAretehKewlest"
        })
        self.assertHasStatus(response, httplib.CREATED)
        player = self.create_player(self.player)
        self.assertTrue(self.logout(), "Logout failed.")

        self.assertHasStatus(self.login(self.root_user), httplib.OK)

        quest = self.create_quest(self.quest)
        # complete quest with the quest URL as the access point
        response = self.app.post(quest["url"],
                                 data={"player_id": player['id'], "status": 0},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(player["url"] + "?quests",
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        player = json.loads(response.data)
        self.assertEqual(player['experience'],
                         self.quest["rewards"]["experience"],
                         "Experience not updated for player.")
        self.assertEqual(len(player['quests']), 1,
                         "Quests list does not have all of the completed " +
                         "quests in it.")

    def test_apply_basic_quest_as_player(self):
        ''' Test creating a basic quest and applying it as player
        Creates a basic quest, then creates a new player and has the player
        complete this quest.  Makes sure the rewards of the quest get applied.
        This uses the player route to completing the quest.
        '''
        self.assertTrue(self.logout(), "Logout failed.")

        response = self.register({
            "username": "Quester",
            "password": "QuestAretehKewlest"
        })
        self.assertHasStatus(response, httplib.CREATED)
        player = self.create_player(self.player)
        self.assertTrue(self.logout(), "Logout failed.")

        self.assertHasStatus(self.login(self.root_user), httplib.OK)

        quest = self.create_quest(self.quest)
        # complete quest with the player URL as the access point
        response = self.app.post(player["url"],
                                 data={"quest_id": quest['id'], "status": 0},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(player["url"] + "?quests",
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        player = json.loads(response.data)
        self.assertEqual(player['experience'],
                         self.quest["rewards"]["experience"],
                         "Experience not updated for player.")
        self.assertEqual(len(player['quests']), 1,
                         "Quests list does not have all of the completed " +
                         "quests in it.")

    def test_request_approval_quest(self):
        ''' Test creating a basic quest, requesting completion, and approving
        Creates a basic quest, then creates a new player and logs in as the
        player.  The player than requests the completion of the quest.  Then
        the administrative user logs in and checks that the request is shown
        and approves it.  Makes sure the rewards of the quest get applied.
        '''
        quest = self.create_quest(self.quest)
        self.assertTrue(self.logout(), "Logout failed.")

        response = self.register({
            "username": "Quester",
            "password": "QuestAretehKewlest"
        })
        self.assertHasStatus(response, httplib.CREATED)
        player = self.create_player(self.player)

        response = self.app.post(quest["url"],
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        self.assertTrue(self.logout(), "Logout failed.")

        self.assertHasStatus(self.login(self.root_user), httplib.OK)
        response = self.app.get(self.endpoints['requests']['url'],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        requests = json.loads(response.data)
        self.assertEqual(
            len(requests), 1, "Requests list not the expected size " +
            "(%s vs %s)".format(len(requests), 1))

        request = requests[0]
        response = self.app.post(request['url'], headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        response = self.app.get(player["url"] + "?quests",
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        player = json.loads(response.data)
        self.assertEqual(player['experience'],
                         self.quest["rewards"]["experience"],
                         "Experience not updated for player.")
        self.assertEqual(len(player['quests']), 1,
                         "Quests list does not have all of the completed " +
                         "quests in it.")
