from base import TestBase
#from unittest import skip
import json
import httplib


class SkillTest(TestBase):
    ''' SkillTest
    Test suite to test the skill system, including creating skill(s) and
    players completing the skill(s).
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
        "rewards": {}
    }

    skill = {
        "name": "Testing",
        "formula": "10*n",
        "bonus": 25
    }

    def create_skill(self, skill=None):
        ''' SkillTest::create_skill
        Helper method, creates a skill entry with the provided information.
        If no information is provided, uses the self.default_skill as default.
        '''
        skill = skill if skill else self.default_skill
        response = self.app.post(self.endpoints["skills"]["url"],
                                 data=json.dumps(skill),
                                 content_type="application/json",
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.CREATED)
        new_skill = json.loads(response.data)
        self.assertEqual(skill["name"], new_skill["name"],
                         "Returned skill's name is not the defined name.")
        return new_skill

    def setUp(self):
        ''' SkillTest::setUp
        Overloaded setup call, this is responsible for creating a root user by
        default.  Mostly useful because of the requirement of a DM user for
        most of the tests.
        '''
        TestBase.setUp(self)
        self.register(self.root_user)

    def test_create_skill(self):
        ''' Tests creating a basic skill
        Creates a skill, makes sure it returns the correct structure
        '''
        skill = self.create_skill(self.skill)
        self.assertTrue("url" in skill)

        response = self.app.get(skill["url"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        server_version = json.loads(response.data)
        self.assertEqual(skill["name"], server_version["name"],
                         "Returned skill's name is not the defined name.")

    def test_create_bad_skill(self):
        ''' Tests creating a skill with missing information
        Attempts to create a skill with missing information, makes sure the
        response gives the proper error.
        '''
        skill = self.skill.copy()
        del skill["name"]
        response = self.app.post(self.endpoints["skills"]["url"],
                                 data=json.dumps(skill),
                                 content_type="application/json",
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    def test_apply_new_skill(self):
        ''' Tests completing a quest with skill rewards
        Creates a quest with a reward that includes skill points, then makes
        sure the reward was applied to the player (the skill will be
        initialized).
        '''
        player = self.create_player(self.player)
        skill = self.create_skill(self.skill)
        quest = self.quest.copy()
        quest["rewards"]["skills"] = {
            skill["id"]: 5
        }
        quest = self.create_quest(quest)

        response = self.app.post(quest["url"],
                                 data={"player_id": player['id']},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

    def test_level_skill(self):
        ''' Tests completing a quest that will level up a skill
        Creates a quest with a reward that includes enough skill points to
        level up a new skill, then has the player complete it.  This should
        then add the bonus for the skill to the XP pool.
        '''
        skill_points = 15

        player = self.create_player(self.player)
        skill = self.create_skill(self.skill)
        quest = self.quest.copy()
        quest["rewards"]["skills"] = {
            skill["id"]: skill_points
        }
        quest = self.create_quest(quest)

        response = self.app.post(quest["url"],
                                 data={"player_id": player['id']},
                                 headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)

        response = self.app.get(player["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        data = json.loads(response.data)
        self.assertEqual(self.skill["bonus"], data["experience"], "The bonus" +
                         " was not applied")
        self.assertIn(skill["id"], data["skills"], "Skill returned with " +
                      "player.")
        player_skill = data["skills"][skill["id"]]
        self.assertEqual(player_skill["level"], 1, "Skill level not correct.")
        self.assertEqual(player_skill["points"], skill_points, "The skill " +
                         "points are not correct.")
