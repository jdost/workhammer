/***
 * RPG javascript library
 * Author: Jeff (jdost)
 *
 * This is a simple javascript wrapping library that handles the request/response
 * structure of the API for the RPG webapp.  It is meant to serve as both an
 * example in how to work with the API as well as an introductory aid in building
 * a webapp around the backend API.
 ***/
window.rpg = (function (lib) {
  if (typeof lib !== 'Object') {
    lib = {};
  }

  var prefix = lib.prefix || '',
    jQuery = window.jQuery || false,

    ready = false,
    loggedIn = false,
    routes,
    queue = []; // Queues up requests while waiting for the initial route request


  lib.loggedIn = function () { return loggedIn; };
  lib.ready = function (func) {
    if (typeof func === 'function') {
      if (ready) { return func(); }
      return queue.push(func);
    }
    return ready;
  };

  var ajax = function (args) {
    if (!args) { return false; }

    if (jQuery) { // If jQuery is available, use it to perform the ajax request
      // Re-encode the data object to a JSON string if contentType is JSON
      if (args.contentType && args.contentType === 'application/json') {
        args.data = JSON.stringify(args.data);
      }
      return jQuery.ajax(args);
    }

    // Manually create and send the XHR
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== xhr.DONE) { return; }
      if (xhr.status >= 300) {  // Only error on status codes > 2xx
        if (!args.statusCode[xhr.status]) {
          return args.error ? args.error(xhr.responseText) : "";
        } else {
          return args.statusCode[xhr.status](xhr.responseText);
        }
      }

      try {
        var data = JSON.parse(xhr.responseText);
      } catch (e) {
        var data = xhr.responseText;
      }
      return args.success ? args.success(data) : "";
    };
    xhr.open(args.type ? args.type : 'GET', prefix + args.url, true);
    xhr.setRequestHeader("Accept", "application/json");
    if (args.data) {
      var data = "";

      if (args.contentType && args.contentType === 'application/json') {
        xhr.setRequestHeader("Content-Type", args.contentType);
        data = JSON.stringify(args.data);
      } else {
        xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
        for (var key in args.data) {
          if (args.data.hasOwnProperty(key)) {
            data += encodeURI(key + '=' + args.data[key] + '&');
          }
        }
        data = data.substr(0, data.length-1);
      }

      xhr.send(data);
    } else {
      xhr.send(null);
    }
    return xhr;
  };


  if (jQuery) {
    // If jQuery is available, it will be used in ajax requests, setup a prefilter
    jQuery.ajaxPrefilter(function (options) {
      options.url = prefix + options.url;
      options.dataType = 'json';
      options.accepts = "application/json";
    });
  }

  function generic(url, data, method, cb) {
    cb = typeof cb === 'undefined' ? {} : cb;

    return ajax({
      url: url,
      data: data,
      type: method,
      success: function (data) {
        if (typeof cb.success === 'function') { cb.success(data); }
      },
      error: function (data) {
        if (typeof cb.error === 'function') { cb.error(data); }
      }
    });
  };

  function getURL (v, def) {
    switch(typeof v) {
      case 'undefined': return def;
      case 'string': return v;
      case 'object': if (v.url) { return v.url; }
      default: return def;
    };
  };

  /**  NOTE
    All of these ajax functions have an optional last argument, this is the
    callback object, the success function will be called upon success of the action
    and error called on any error of the action.

    Optional in all actions, the events will be triggered as well.

    All of these ajax functions will return a true or false boolean whether sending
    the request.  So just use:
      if (!rpg.user.register()) { } // I has an error
   **/

  // users {{{
  lib.user = {};
  /** user.register:
      args: credentials object:
        username - (string) username to register
        password - (string) password for this username to authenticate with

    Tries to register the user with the application.
   **/
  lib.user.register = function (credentials, cb) {
    if (!credentials.username || !credentials.password) {
      return false;
    }
    if (!ready) { return queue.push(function () { lib.user.register(credentials); }); }
    cb = cb || {};

    var temp = cb.success;
    cb.success = function (data) {
      loggedIn = true;
      if (typeof temp === 'function') { temp(data); }
    };

    return generic(
      routes.register.url,
      credentials,
      'POST',
      cb);
  };

  /** user.login
      args: credentials object:
        username - (string) username to login with (should be registered)
        password - (string) password to login with (set during registration)

    Attempts to login with the provided username//password combination.
   **/
  lib.user.login = function (credentials, cb) {
    if (!credentials.username || !credentials.password) {
      return false;
    }
    if (!ready) { return queue.push(function () { lib.user.login(credentials); }); }
    cb = cb || {};

    var temp = cb.success;
    cb.success = function (data) {
      loggedIn = true;
      if (typeof temp === 'function') { temp(data); }
    };

    return generic(
      routes.login.url,
      credentials,
      'POST',
      cb);
  };

  /** user.logout
    Notifies the application to void the current session and log out the user
    account.  Upon completion of the request, the LOGOUT event will be triggered.
   **/
  lib.user.logout = function (cb) {
    if (!ready) { return queue.push(function () { lib.user.logout(); }); }
    cb = cb || {};

    var temp = cb.success;
    cb.success = function (data) {
      loggedIn = false;
      if (typeof temp === 'function') { temp(data); }
    };

    return generic(
      routes.logout.url,
      '',
      'GET',
      cb);
  };
  /** user.get
    Retrieves the currently logged in user document.
   **/
  lib.user.get = function (cb) {
    if (!loggedIn) { return; }

    return generic(
      routes.user.url,
      '',
      'GET',
      cb);
  };
  // }}}

  // player {{{
  lib.player = {};
  /** player.get
      args: (optional) player - (player object) player object returned from app

    Retrieves either a list of short representations of all players on the
    application (if no arguments given) or the full representation of the specific
    player give (as the argument).
   **/
  lib.player.get = function (player, cb) {
    if (!ready) { return queue.push(function () { lib.player.get(player); }); }

    var url = getURL(player, routes.players.url);
    if (player.success || player.error) {
      cb = player;
    }

    return generic(
      url,
      '',
      'GET',
      cb);
  };
  /** player.create
      args: player - (hash table) describes the various properties of the player to
              create
            (optional) user - (id string) user to try and create the player for, if
              not defined, will create the player for the logged in user

    Takes the hash table in and tries to create the player using the provided
    properties.
   **/
  lib.player.create = function (player, user, cb) {
    if (typeof player !== 'object') { return false; }
    if (typeof user === 'object' && user.id) {
      player.user = user.id;
    } else if (typeof user === 'string') {
      player.user = user;
    } else if (typeof user === 'object' && (user.success || user.error)) {
      cb = user;
    }

    cb = cb || {};

    // using ajax because of the contentType
    return ajax({
      url: routes.players.url,
      type: 'POST',
      contentType: 'application/json',
      data: player,
      success: function (data) {
        if (typeof cb.success === 'function') { cb.success(data); }
      },
      error: function (msg) {
        if (typeof cb.error === 'function') { cb.error(msg); }
      }
    });
  };
  /** player.complete
      args: player - (player object) player object for the player completing quest
            quest - (quest object) quest object returned from app, one to complete

    Tells the application that the player has completed a quest.  This will update
    the Player with the rewards of the quest being completed.
   **/
  lib.player.quest = function (player, quest, cb) {
    if (typeof player !== 'object' || !player.url) { return false; }
    if (typeof quest !== 'object' && typeof quest !== 'string') { return false; }
    quest = quest.id ? quest.id : quest;

    return generic(
      player.url,
      { 'quest': quest },
      'POST',
      cb);
  };
  // }}}

  // quest {{{
  lib.quest = {};
  /** quest.get
      args: (optional) quest - (quest object) quest object returned from app

    Retrieves either a list of short representations of all quests on the
    application (if no arguments given) or the full representation of the specific
    quest given (as the argument).
   **/
  lib.quest.get = function (quest, cb) {
    if (!ready) { return queue.push(function () { lib.quest.get(quest, cb); }); }

    var url = getURL(quest, routes.quest.url);
    if (typeof quest === 'object' && (quest.success || quest.error)) {
      cb = quest;
    }

    return generic(
      url,
      '',
      'GET',
      cb);
  };
  /** quest.create
      args: quest - (hash table) describes the various properties of the quest to
              create

    Takes the hash table in and tries to create the quest using the provided
    properties.
   **/
  lib.quest.create = function (quest, cb) {
    if (typeof quest !== 'object') { return false; }
    cb = cb || {};

    return ajax({
      url: routes.quests.url,
      type: 'POST',
      contentType: 'application/json',
      data: quest,
      success: function (data) {
        if (typeof cb.success === 'function') { cb.success(data); }
      },
      error: function (msg) {
        if (typeof cb.error === 'function') { cb.error(msg); }
      }
    });
  };
  /** quest.complete
      args: quest - (quest object) quest object returned from app, one to complete
            player - (player object) player object for the player completing quest

    Tells the application that the player has completed a quest.  This will update
    the Player with the rewards of the quest being completed.
   **/
  lib.quest.complete = function (quest, player, cb) {
    if (typeof quest !== 'object' || !quest.url) { return false; }
    if (typeof player !== 'object' && typeof player !== 'string') { return false; }

    player = player.id ? player.id : player;

    return generic(
      quest.url,
      { 'player': player },
      'POST',
      cb);
  };
  // }}}

  // skill {{{
  lib.skill = {};
  /** skill.get
      args: (optional) skill - (skill object) skill object returned from app

    Retrieves either a list of short representations of all skills on the
    application (if no arguments given) or the full representation of the specific
    skill given (as the argument).
   **/
  lib.skill.get = function (skill, cb) {
    if (!ready) { return queue.push(function () { lib.skill.get(skill, cb); }); }

    var url = getURL(skill, routes.skills.url);
    if (typeof skill === 'object' && (skill.success || skill.error)) {
      cb = skill;
    }

    return generic(
      url,
      '',
      'GET',
      cb);
  };
  /** skill.create
      args: skill - (hash table) describes the various properties of the skill to
              create

    Takes the hash table in and tries to create the skill using the provided
    properties.
   **/
  lib.skill.create = function (skill, cb) {
    if (typeof skill !== 'object') { return false; }
    cb = cb || {};

    return ajax({
      url: routes.skills.url,
      type: 'POST',
      contentType: 'application/json',
      data: skill,
      success: function (data) {
        if (typeof cb.success === 'function') { cb.success(data); }
      },
      error: function (msg) {
        if (typeof cb.error === 'function') { cb.error(msg); }
      }
    });
  };
  // }}}

  // classes {{{
  lib.classes = {};
  /** classes.get
      args: (optional) class - (class object) class object returned from app

    Retrieves either a list of short representations of all classes on the
    application (if no arguments given) or the full representation of the specific
    class given (as the argument).
   **/
  lib.classes.get = function (cls, cb) {
    if (!ready) { return queue.push(function () { lib.classes.get(cls, cb); }); }

    var url = getURL(cls, classes.routes.url);
    if (typeof cls === 'object' && (cls.success || cls.error)) {
      cb = cls;
    }

    return generic(
      url,
      '',
      'GET',
      cb);
  };
  /** classes.create
      args: class - (hash table) describes the various properties of the class to
              create

    Takes the hash table in and tries to create the class using the provided
    properties.
   **/
  lib.classes.create = function (cls, cb) {
    if (typeof cls !== 'object') { return false; }
    cb = cb || {};

    return ajax({
      url: routes.classes.url,
      type: 'POST',
      contentType: 'application/json',
      data: cls,
      success: function (data) {
        if (typeof cb.success === 'function') { cb.success(data); }
      },
      error: function (msg) {
        if (typeof cb.error === 'function') { cb.error(msg); }
      }
    });
  };
  // }}}

  ajax({ // Has to request the endpoints from the API server
    url: '/',
    success: function (data) {
      routes = data;
      ready = true;
      if (data.logged_in) { loggedIn = true; }

      if (queue.length) { // If there are any requests queued up, make them now
        for (var i = queue.length; i > 0; i--) {
          (queue.pop())();
        }
      }
    }
  });

  return lib;
}({}));
