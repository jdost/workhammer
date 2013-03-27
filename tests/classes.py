from base import TestBase
import json
import httplib


class ClassTest(TestBase):
    ''' ClassTest
    Test suite to test the class system, including creating class(es) and
    players leveling up class(es).
    '''

    player = {
        "name": "Aech"
    }

    root_user = {
        "username": "dungeon_master",
        "password": "guess me if you can, hah!"
    }

    quest = {
        "name": "Testing Quest",
        "description": "A quest to test classes",
        "rewards": {}
    }

    default_class = {
        "name": "Tester",
        "formula": "10*n"
    }

    def create_class(self, class_info=None):
        ''' ClassTest::create_class
        Helper method, creates a class entry with the provided information.
        If no information is provided, uses the self.default_class as default.
        '''
        class_info = class_info if class_info else self.default_class
        response = self.app.post(self.endpoints["classes"]["url"],
                                 data=json.dumps(class_info),
                                 content_type="application/json",
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.CREATED)
        new_class = json.loads(response.data)
        self.assertEqual(class_info["name"], new_class["name"],
                         "Returned class' name is not the defined name.")
        return new_class

    def setUp(self):
        ''' ClassTest::setUp
        Overloaded setup call, this is response for creating a root user by
        default.
        '''
        TestBase.setUp(self)
        self.register(self.root_user)

    def test_create_class(self):
        ''' Tests creating a basic class
        Creates a class, makes sure it returns the correct structure
        '''
        cls = self.create_class(self.default_class)
        self.assertTrue("url" in cls)

        response = self.app.get(cls["url"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        server = json.loads(response.data)
        self.assertEqual(cls["name"], server["name"],
                         "Returned class' name is not the defined name.")

        response = self.app.get(self.endpoints["classes"]["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        class_list = json.loads(response.data)
        self.assertEqual(len(class_list), 1, "Class not in class list")

    def test_create_bad_class(self):
        ''' Tests creating bad class
        '''
        response = self.app.post(self.endpoints["classes"]["url"],
                                 data="classstuff")
        self.assertHasStatus(response, httplib.BAD_REQUEST)

        cls = self.create_class()
        response = self.app.put(cls["url"], data="changed")
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    def test_create_bad_skill(self):
        ''' Tests creating a skill with missing information
        Attempts to create a skill with missing information, makes sure the
        response gives the proper error.
        '''
        cls = self.default_class.copy()
        del cls["name"]
        response = self.app.post(self.endpoints["classes"]["url"],
                                 data=json.dumps(cls),
                                 content_type="application/json",
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    def test_level_skill(self):
        ''' Tests leveling a skill that effects a class
        Creates a skill, quest that levels the skill, class that uses the skill
        and completes the quest, leveling the skill and increasing the
        experience in the class.  Checks that all of this worked.
        '''
        skill = self.create_skill()

        quest = self.quest.copy()
        quest["rewards"]["skills"] = {
            skill["id"]: 11
        }
        quest = self.create_quest(quest)

        cls = self.default_class.copy()
        cls["skills"] = {
            skill["id"]: 5
        }
        cls = self.create_class(cls)

        player = self.create_player(self.player)
        response = self.app.post(quest["url"],
                                 data={"player_id": player["id"], "status": 0},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(player["url"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        player_info = json.loads(response.data)
        self.assertIn(cls["id"], player_info["classes"])

    def test_level_class(self):
        ''' Tests leveling a class via a quest
        Creates a set of quest/skill/class that when the quest is completed,
        the class will level, leveling the player character.
        '''
        skill = self.create_skill()

        quest = self.quest.copy()
        quest["rewards"]["skills"] = {
            skill["id"]: 11
        }
        quest = self.create_quest(quest)

        cls = self.default_class.copy()
        cls["skills"] = {
            skill["id"]: 11
        }
        cls = self.create_class(cls)

        player = self.create_player(self.player)
        response = self.app.post(quest["url"],
                                 data={"player_id": player["id"], "status": 0},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(player["url"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        player_info = json.loads(response.data)
        self.assertIn(cls["id"], player_info["classes"])
        self.assertEqual(player_info["level"], 1)

    def test_update_class(self):
        ''' Tests creating and then modifying a class
        Creates a class, then updates the class with the new information, makes
        sure that the class updated.
        '''
        cls = self.create_class(self.default_class)
        cls["name"] = "New Class"
        response = self.app.put(cls["url"], data=json.dumps(cls),
                                content_type="application/json",
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        new_cls = json.loads(response.data)
        self.assertEqual(new_cls["name"], cls["name"])

    def test_leaders(self):
        ''' Tests leader board for classes
        Creates a quest/skill/class that, when the quest is completed, the
        skill will level, putting the player on the class leader board.  Then
        checks that the player is on the leader board.
        '''
        skill = self.create_skill()

        quest = self.quest.copy()
        quest["rewards"]["skills"] = {
            skill["id"]: 11
        }
        quest = self.create_quest(quest)

        cls = self.default_class.copy()
        cls["skills"] = {
            skill["id"]: 5
        }
        cls = self.create_class(cls)

        response = self.app.get(cls["leaders"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        data = json.loads(response.data)
        self.assertEmpty(data)

        player = self.create_player(self.player)
        response = self.app.post(quest["url"],
                                 data={"player_id": player["id"], "status": 0},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(cls["leaders"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        data = json.loads(response.data)
        self.assertEqual(len(data), 1, "Leader board is incorrect size.")
