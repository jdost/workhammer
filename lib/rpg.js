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
    routes,
    queue = []; // Queues up requests while waiting for the initial route request


  var ajax = function (args) {
    if (!args) { return false; }

    if (jQuery) { // If jQuery is available, use it to perform the ajax request
      return jQuery.ajax(args);
    }

    // Manually create and send the XHR
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== xhr.DONE) { return; }
      if (xhr.status >= 300) {  // Only error on status codes > 2xx
        if (!args.statusCode[xhr.status]) {
          if (args.error) {
            return args.error(xhr.responseText);
          }

          return;
        } else {
          return args.statusCode[xhr.status](xhr.responseText);
        }
      }

      try {
        var data = JSON.parse(xhr.responseText);
      } catch (e) {
        var data = xhr.responseText;
      }
      if (args.success) {
        return args.success(data);
      }
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
  };

  var callbacks = {},
  /**
  Events that this library will 'trigger' and the user can 'bind' to.  Mostly useful
  for the async callbacks.
   **/
    events = {
      REGISTER: 'userRegistered',
      REGISTRATION_FAILED: 'failedRegistration',
      LOGIN: 'userLoggedIn',
      LOGIN_FAILED: 'failedLogin',
      LOGOUT: 'userLoggedOut',

      PLAYER: 'playersRetrieved',
      PLAYER_CREATED: 'playerWasCreated',
      PLAYER_CREATION_ERROR: 'errorCreatingPlayer',

      QUEST: 'questsRetrieved',
      QUEST_CREATED: 'questWasCreated',
      QUEST_CREATION_ERROR: 'errorCreatingQuest',
      QUEST_COMPLETED: 'questCompleted'
    };

  lib.EVENTS = events;
  for (e in events) { // makes the events externally visible and initializes the
      // callback array
    if (events.hasOwnProperty(e)) {
      callbacks[events[e]] = [];
      lib.EVENTS[e] = events[e];
    }
  }

  // bind: pseudo event binding, just stores the callback function in an array
  lib.bind = function (evt, callback) {
    if (!callbacks[evt]) { return; } // Not a valid event
    callbacks[evt].push(callback);
  };
  // trigger: pseudo event triggering, just calls all of the stored callbacks
  lib.trigger = function (evt, args) {
    if (!callbacks[evt]) { return; } // Not a valid event
    for (var i = 0, l = callbacks[evt].length; i < l; i++) {
      callbacks[evt][i](args);
    }
  };

  if (jQuery) {
    // If jQuery is available, it will be used in ajax requests, setup a prefilter
    jQuery.ajaxPrefilter(function (options) {
      options.url = prefix + options.url;
      options.dataType = 'json';
    });
  }

  // users {{{
  lib.user = {};
  /** register:
      args: username - (string) username to register
            password - (string) password for this username to authenticate with

    Tries to register the user with the application, will trigger a REGISTERED event
    if the request succeeds, otherwise will trigger a REGISTRATION_FAILED event.

    NOTE: maybe should trigger a LOGIN event instead/additionally to the REGISTERED
    event
   **/
  lib.user.register = function (credentials) {
    if (!credentials.username || !credentials.password) {
      return;
    }
    if (!ready) { return queue.push(function () { lib.user.register(credentials); }); }

    ajax({
      url: routes.register.url,
      data: credentials,
      type: 'POST',
      success: function (data) {
        lib.trigger(events.REGISTER);
      },
      statusCode: {
        409: function () { lib.trigger(events.REGISTRATION_FAILED); }
      }
    });
  };

  /** login
      args: username - (string) username to login with (should be registered)
            password - (string) password to login with (set during registration)

    Attempts to login with the provided username//password combination.  If the
    attempt is successful, will trigger a LOGIN event, if the attempt fails, a
    LOGIN_FAILED event will be triggered.
   **/
  lib.user.login = function (credentials) {
    if (!credentials.username || !credentials.password) {
      return;
    }
    if (!ready) { return queue.push(function () { lib.user.login(credentials); }); }

    ajax({
      url: routes.login.url,
      data: credentials,
      type: 'POST',
      success: function (data) {
        lib.trigger(events.LOGIN);
      },
      statusCode: {
        400: function () { lib.trigger(events.LOGIN_FAILED); }
      }
    });
  };

  /** logout
    Notifies the application to void the current session and log out the user
    account.  Upon completion of the request, the LOGOU event will be triggered.
   **/
  lib.user.logout = function () {
    if (!ready) { return queue.push(function () { lib.user.logout(); }); }

    ajax({
      url: routes.logout.url,
      type: 'GET',
      success: function (data) {
        lib.trigger(events.LOGOUT);
      },
      statusCode: {
      }
    });
  };
  // }}}

  // player {{{
  lib.player = {};
  /** player.get
      args: (optional) player - (player object) player object returned from app

    Retrieves either a list of short representations of all players on the
    application (if no arguments given) or the full representation of the specific
    player give (as the argument).  Triggers the PLAYER event upon completion with
    either an array (for the full list) or a single object (for the specific player)
   **/
  lib.player.get = function (player) {
    if (!ready) { return queue.push(function () { lib.player.get(player); }); }
    var url = routes.players.url;
    if (typeof player === 'object' && player.url) {
      url = player.url;
    }

    ajax({
      url: url,
      type: 'GET',
      success: function (data) {
        lib.trigger(events.PLAYER, data);
      }
    });
  };
  /** player.create
      args: player - (hash table) describes the various properties of the player to
              create
            (optional) user - (id string) user to try and create the player for, if
              not defined, will create the player for the logged in user

    Takes the hash table in and tries to create the player using the provided
    properties.  Upon success, will trigger the PLAYER_CREATED event.  If an error
    occurred, the PLAYER_CREATION_ERROR event will be triggered.
   **/
  lib.player.create = function (player, user) {
    if (typeof player !== 'object') { return false; }
    if (typeof user === 'object' && user.id) {
      player.user = user.id;
    } else if (typeof user === 'string') {
      player.user = user;
    }

    ajax({
      url: routes.players.url,
      type: 'POST',
      contentType: 'application/json',
      data: player,
      success: function (data) {
        lib.trigger(events.PLAYER_CREATED, data);
      },
      error: function (data) {
        lib.trigger(events.PLAYER_CREATION_ERROR, data);
      }
    });
  };
  /**
   **/
  lib.player.quest = function (player, quest) {
    if (typeof player !== 'object' || !player.url) { return false; }
    if (typeof quest !== 'object' && typeof quest !== 'string') { return false; }

    var url = player.url;
    var quest = quest.id if quest.id else quest;

    ajax({
      url: url,
      type: 'POST',
      data: { 'quest': quest },
      success: function (data) {
        lib.trigger(events.QUEST_COMPLETED, data);
      }
    });
  };
  // }}}

  // quest {{{
  lib.quest = {};
  /** quest.get
      args: (optional) quest - (quest object) quest object returned from app

    Retrieves either a list of short representations of all quests on the
    application (if no arguments given) or the full representation of the specific
    player give (as the argument).  Triggers the QUEST event upon completion with
    either an array (for the full list) or a single object (for the specific quest)
   **/
  lib.quest.get = function (quest) {
    if (!ready) { return queue.push(function () { lib.quest.get(quest); }); }
    var url = routes.quest.url;
    if (typeof quest === 'object' && quest.url) {
      url = quest.url;
    }

    ajax({
      url: url,
      type: 'GET',
      success: function (data) {
        lib.trigger(events.QUEST, data);
      }
    });
  };
  /** quest.create
      args: quest - (hash table) describes the various properties of the quest to
              create
            (optional) user - (id string) user to try and create the quest for, if
              not defined, will create the quest for the logged in user

    Takes the hash table in and tries to create the quest using the provided
    properties.  Upon success, will trigger the QUEST_CREATED event.  If an error
    occurred, the QUEST_CREATION_ERROR event will be triggered.
   **/
  lib.quest.create = function (quest, user) {
    if (typeof quest !== 'object') { return false; }
    if (typeof user === 'object' && user.id) {
      quest.user = user.id;
    } else if (typeof user === 'string') {
      quest.user = user;
    }

    ajax({
      url: routes.quests.url,
      type: 'POST',
      contentType: 'application/json',
      data: quest,
      success: function (data) {
        lib.trigger(events.QUEST_CREATED, data);
      },
      error: function (data) {
        lib.trigger(events.QUEST_CREATION_ERROR, data);
      }
    });
  };
  /**
   **/
  lib.quest.complete = function (quest, player) {
    if (typeof quest !== 'object' || !quest.url) { return false; }
    if (typeof player !== 'object' && typeof player !== 'string') { return false; }

    var url = quest.url;
    var player = player.id if player.id else player;

    ajax({
      url: url,
      type: 'POST',
      data: { 'player': player },
      success: function (data) {
        lib.trigger(events.QUEST_COMPLETED, data);
      }
    });
  };
  // }}}

  ajax({ // Has to request the endpoints from the API server
    url: '/',
    success: function (data) {
      routes = data;
      ready = true;
      if (queue.length) { // If there are any requests queued up, make them now
        for (var i = queue.length; i > 0; i--) {
          (queue.pop())();
        }
      }
    }
  });

  return lib;
}({}));
