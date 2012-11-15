from base import TestBase
from unittest import skip
import httplib


class LoginTest(TestBase):
    ''' LoginTest
    Test suite to test the login functionality.
    '''
    user = {
        "username": "testuser",
        "password": "testting password"
    }

    def test_good_login(self):
        ''' LoginTest::test_good_login
        Performs a login that should be successful, base test (if this fails,
        most of the subsequent tests in this suite should fail).
        '''
        response = self.register(self.user)
        response = self.app.get(self.endpoints["logout"]["url"],
                headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        response = self.app.post(self.endpoints["login"]["url"],
                data=self.user,
                headers=self.json_header)
        self.assertHasStatus(response, httplib.OK)

    def test_bad_login(self):
        ''' LoginTest::test_bad_login
        Performs a login that should fail, used to make sure the failure
        reporting and response are properly working.
        '''
        response = self.app.post(self.endpoints["login"]["url"],
                data=self.user,
                headers=self.json_header)
        self.assertHasStatus(response, httplib.BAD_REQUEST)

    @skip("Reset password functionality will be added later")
    def test_reset_password(self):
        ''' LoginTest::test_reset_password
        Requests a password reset, this should then kick off the process to
        recover an account with a forgotten password.
        '''
        pass

    def test_register(self):
        ''' LoginTest::test_register
        Registers a new user, should go through the full process to create the
        user and then make sure the user has logged in.
        '''
        response = self.register()
        self.assertHasStatus(response, httplib.CREATED)

    def test_username_conflict(self):
        ''' LoginTest::test_username_conflict
        Registers a new user, then tries to register the user again, should
        return an error.
        '''
        response = self.register(self.user)
        response = self.app.get(self.endpoints["logout"]["url"],
                headers=self.json_header)
        self.assertHasStatus(response, httplib.ACCEPTED)
        response = self.register({
            "username": self.user["username"],
            "password": "different one"
        })
        self.assertHasStatus(response, httplib.CONFLICT)
