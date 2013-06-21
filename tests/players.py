from base import TestBase
import json
import httplib


class PlayerTest(TestBase):
    ''' PlayerTest
    Test suite to test the player information functionality.
    '''

    player = {
        "name": "Trogdor"
    }

    root_user = {
        "username": "rootuser",
        "password": "i am teh rootz0rz"
    }

    def setUp(self):
        ''' PlayerTest::setUp
        Overloaded setup call, This is responsible for creating a root user by
        default and logging them out.  Mostly useful because all of the users
        created subsequently will have default permissions.
        '''
        TestBase.setUp(self)
        self.register(self.root_user)
        self.logout()

    def get_player_list(self):
        ''' PlayerTest::get_player_list
        Helper method, retrieves the list of players.  Checks the request was
        successful and returns a <list> of the player entries.
        '''
        response = self.app.get(self.endpoints["players"]["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        return json.loads(response.data)

    def send_player(self, player):
        ''' PlayerTest::send_player
        Helper method, sends the passed in packet to try and create a player,
        does no assertions on the response, just returns it.
        '''
        return self.app.post(self.endpoints["players"]["url"],
                             data=player,
                             content_type="application/json",
                             headers=self.json_header)

    def test_empty_list(self):
        ''' Test empty player list
        Grabs the player list (which should be initially empty) and makes sure
        it returns an empty array.
        '''
        players = self.get_player_list()
        self.assertEmpty(players, "Returned player list was not empty.")

    def test_create_own_player(self):
        ''' Test a user creating their own player
        Creates a player for current user, then checks to see that the player
        was properly created.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)

        player = self.create_player(self.player)
        self.assertIn("url", player)

        players = self.get_player_list()
        self.assertEqual(
            1, len(players),
            "The returned player list " +
            "({}) is not the expected size (1)".format(len(players)))

        response = self.app.get(player["url"], headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        data = json.loads(response.data)
        self.assertEqual(data["name"], player["name"])

        response = self.send_player(json.dumps(self.player))
        self.assertHasStatus(response, httplib.CONFLICT)

    def test_create_bad_player(self):
        ''' Tests creating a badly formed player
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)

        response = self.send_player({"name": "bad"})
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    def test_create_other_player(self):
        ''' Test a DM creating a player for another user
        Creates a player for another user, then checks that the player was
        properly created.  Tries to create a second player for a user, should
        be a conflict.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)
        id = json.loads(response.data)
        self.assertTrue(self.logout(), "Logout failed.")

        response = self.login(self.root_user)
        self.assertHasStatus(response, httplib.OK)

        other_player = {'user': id}
        other_player.update(self.player)
        self.create_player(other_player)
        self.create_player(self.player)

        other_player["name"] = "Newbie"
        response = self.send_player(json.dumps(other_player))
        self.assertHasStatus(response, httplib.CONFLICT)

    def test_create_other_player_no_perms(self):
        ''' Test a non DM creating a player for another user
        Creates a player for another user, should fail as the user shouldnt
        have permissions
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)
        id = json.loads(response.data)
        self.assertTrue(self.logout(), "Logout failed.")

        response = self.register({"username": "herp", "password": "derp"})
        other_player = {'user': id}
        other_player.update(self.player)
        response = self.send_player(json.dumps(other_player))
        self.assertHasStatus(response, httplib.UNAUTHORIZED)

    def test_edit_player(self):
        ''' Test a user editting their player
        Creates a player, then modifies the player.  The player's data should
        be changed and not create a new clone.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)
        player_orig = self.create_player({
            "name": "Charles"
        })

        new_name = "Chuck"
        response = self.app.put(
            player_orig["url"],
            data=json.dumps({"name": new_name}),
            content_type="application/json",
            headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        player_new = json.loads(response.data)

        self.assertEqual(
            new_name, player_new["name"],
            "Player's name was not properly changed ({} - {})".format(
                new_name, player_new["name"]))
        self.assertEqual(
            player_orig["url"], player_new["url"],
            "Player URL was changed: {} -> {}".format(
                player_orig["url"], player_new["url"]))

        players = self.get_player_list()
        self.assertEqual(
            1, len(players),
            "The returned player list " +
            "({}) is not the expected size (1)".format(len(players)))

    def test_create_second_player(self):
        ''' Test a player trying to create a second player
        Tries to create a player for a user that already has one, should fail
        with a warning of this condition.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)
        self.create_player(self.player)

        response = self.send_player(json.dumps(self.player))
        self.assertHasStatus(response, httplib.CONFLICT)

    def test_list_caching(self):
        ''' Tests list caching with player creation/modification
        Grabs a player list, then grabs again, checking that it is cached. Then
        creates a player.  Makes sure the new player list wasn't cached, grabs
        again, making sure it is cached now, then modifies the created player
        and checks the player list for being cached.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)

        response = self.app.get(self.endpoints["players"]["url"],
                                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)
        headers = self.json_header
        headers.append(('If-None-Match', response.headers.get("ETag")))
        response = self.app.get(self.endpoints["players"]["url"],
                                headers=headers)
        self.assertHasStatus(response, httplib.NOT_MODIFIED)

        player = self.create_player(self.player)
        response = self.app.get(self.endpoints["players"]["url"],
                                headers=headers)
        self.assertHasStatus(response, httplib.OK)
        headers = self.json_header
        headers.append(('If-None-Match', response.headers.get("ETag")))
        response = self.app.get(self.endpoints["players"]["url"],
                                headers=headers)
        self.assertHasStatus(response, httplib.NOT_MODIFIED)

        response = self.app.put(
            player["url"], data=json.dumps({"name": "Maria"}),
            content_type="application/json", headers=headers)
        self.assertHasStatus(response, httplib.ACCEPTED)
        response = self.app.get(self.endpoints["players"]["url"],
                                headers=headers)
        self.assertHasStatus(response, httplib.OK)

    def test_player_caching(self):
        ''' Tests caching of a single player
        Creates a player, grabs the player, tries again and ensures it was
        cached.  Then modifies player, tries again and makes sure the cache
        was update.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)
        headers = self.json_header

        player = self.create_player({"name": "Charles"})
        response = self.app.get(player["url"], headers=headers)
        self.assertHasStatus(response, httplib.OK)
        headers.append(('If-None-Match', response.headers.get('ETag')))
        response = self.app.get(player["url"], headers=headers)
        self.assertHasStatus(response, httplib.NOT_MODIFIED)

        new_name = "Chuck"
        response = self.app.put(
            player["url"], data=json.dumps({"name": new_name}),
            content_type="application/json", headers=headers)
        self.assertHasStatus(response, httplib.ACCEPTED)
        headers = self.json_header
        response = self.app.get(player["url"], headers=headers)
        self.assertHasStatus(response, httplib.OK)
        headers.append(('If-None-Match', response.headers.get('ETag')))
        response = self.app.get(player["url"], headers=headers)
        self.assertHasStatus(response, httplib.NOT_MODIFIED)
