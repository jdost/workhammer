''' users.py
This is the collection of functions that handle the interaction with the app
users.  Mainly handling registering, logging in/out, account changes, etc.
'''
from flask import request, redirect, url_for, session
from . import app, password_hash, logger
from .database import User, errors, Sessions
from .decorators import datatype
import httplib


@app.endpoint('/register', methods=['POST'])
@datatype
def register():
    ''' register -> POST /register
        POST: username=[string]&password=[string]
    Tries to register the provided username with the provided password
    '''
    username = request.form['username']
    password = request.form['password']
    try:
        id, role = User.create({
            'username': username,
            'password': password_hash(password)
        })
    except errors.ExistingUsernameError as err:
        logger.info(err)
        return httplib.CONFLICT

    session['id'] = str(id)
    session['role'] = role
    logger.info("Username %s registered.", username)

    return redirect(url_for('index')) if request.is_html else \
        ('"' + str(id) + '"', httplib.CREATED)


@app.endpoint('/login', methods=['POST'])
@datatype
def login():
    ''' login -> POST /login
        POST: username=[string]&password=[string]
    Tries to match the provided username and password against stored Users, if
    a match is found, it is linked with the current session, if not, a
    BAD_REQUEST is returned
    '''
    username = request.form['username']
    password = request.form['password']
    user, id, roles = User.login(username, password_hash(password))
    if id:
        session['id'] = str(id)
        session['role'] = roles
        if 'player' in user:
            session['player'] = user['player']
        logger.info("User %s (%s) logged in.", username, id)
        return redirect(url_for('index')) if request.is_html else \
            (user, httplib.OK)
    else:
        logger.warning("Login for %s failed.", username)
        return "Invalid credentials", httplib.BAD_REQUEST


@app.endpoint('/logout', methods=['GET'])
@datatype
def logout():
    ''' logout -> GET /logout
    Removes the credentials from the session, effectively removing all session
    stored information.
    '''
    logger.info("User (%s) logged out.", session['id'])
    Sessions.remove(session['_id'])
    session.clear()
    return redirect(url_for('index')) if request.is_html else httplib.ACCEPTED
