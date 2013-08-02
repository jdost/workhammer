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
    if (isFunction(func)) {
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
          if (xhr.status < 400) { return; }  // Don't call `error` if a redirect
          return args.error ? args.error(xhr.responseText, xhr) : "";
        } else {
          return args.statusCode[xhr.status](xhr.responseText, xhr);
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

      var err = options.error;
      options.error = function (xhr) { err(xhr.responseText, xhr); };
    });
  }

  function generic(url, data, method, cb) {
    cb = isUndefined(cb) ? {} : cb;

    return ajax({
      url: url,
      data: data,
      type: method,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (data, xhr) {
        if (isFunction(cb.error)) { cb.error(data, xhr); }
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

  function isFunction (a) { return typeof a === 'function'; };
  function isObject (a) { return typeof a === 'object'; };
  function isString (a) { return typeof a === 'string'; };
  function isUndefined (a) { return typeof a === 'undefined'; };

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
      if (isFunction(temp)) { temp(data); }
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
      if (isFunction(temp)) { temp(data); }
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
      if (isFunction(temp)) { temp(data); }
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
      var temp = player.success;

      cb.success = function (data) {
        temp ? temp(lib.utils.convertArray(data)) : "";
      };
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
    if (!isObject(player)) { return false; }
    if (isObject(user) && user.id) {
      player.user = user.id;
    } else if (isString(user)) {
      player.user = user;
    } else if (isObject(user) && (user.success || user.error)) {
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
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
      }
    });
  };
  /** player.modify
      args: player - (player object) original player object for the player being
              modified
            details - (hash table) describes the new properties of the player, must
              include the 'url' property of an existing player

    Takes the hash table and tries to send it to the backend as a modification set
    on the player passed in.
   **/
  lib.player.modify = function (player, details, cb) {
    if (!isObject(player)) { return false; }
    if (!isObject(details)) { return false; }

    cb = cb || {};
    var url = getURL(player, false);
    if (!url) { return false; }

    return ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json',
      data: details,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
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
    if (!isObject(player) || !player.url) { return false; }
    if (!isObject(quest) && !isString(quest)) { return false; }
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

    var url = getURL(quest, routes.quests.url);
    if (isObject(quest) && (quest.success || quest.error)) {
      cb = quest;
      var temp = quest.success;

      cb.success = function (data) {
        temp ? temp(lib.utils.convertArray(data)) : "";
      };
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
    if (!isObject(quest)) { return false; }
    cb = cb || {};

    return ajax({
      url: routes.quests.url,
      type: 'POST',
      contentType: 'application/json',
      data: quest,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
      }
    });
  };
  /** quest.modify
      args: quest - (Quest object) original quest object for the skill being
              modified
            details - (hash table) describes the new properties of the quest, must
              include the 'url' property of an existing quest

    Takes the hash table and tries to send it to the backend as a modification set
    on the quest passed in.
   **/
  lib.quest.modify = function (quest, details, cb) {
    if (!isObject(quest)) { return false; }
    if (!isObject(details)) { return false; }

    cb = cb || {};
    var url = getURL(quest, false);
    if (!url) { return false; }

    return ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json',
      data: details,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
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
    if (isObject(quest) && quest.quest && quest.player) {
      if (isObject(player) && (player.success || player.error)) {
        cb = player;
      }

      return generic(
        quest.url,
        '',
        'POST',
        cb);
    }

    if (!isObject(quest) || !quest.url) { return false; }
    if (!isObject(player) && !isString(player)) { return false; }

    player = player.id ? player.id : player;

    return generic(
      quest.url,
      { 'player': player },
      'POST',
      cb);
  };
  /** quests.pending
    Retrieves the list of pending quest requests.
   **/
  lib.quest.pending = function (cb) {
    cb = cb || {};

    return generic(
      routes.requests.url,
      '',
      'GET',
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
    if (isObject(skill) && (skill.success || skill.error)) {
      cb = skill;
      var temp = skill.success;

      cb.success = function (data) {
        temp ? temp(lib.utils.convertArray(data)) : "";
      };
    }

    return generic(
      url,
      '',
      'GET',
      cb);
  };
  /** skill.leaders
      args: skill - (skill object) skill object returned from app
            (optional) limit - how many leaders to get

    Retrieves the list of leaders for the provided skill, if the limit argument is
    provided, it will change from the default of 10.
   **/
  lib.skill.leaders = function (skill, limit, cb) {
    if (!isObject(skill)) { return false; }
    cb = cb || {};
    var params = '';

    var url = skill.leaders;
    if (isObject(limit)) {
      cb = limit;
    } else {
      params = { 'limit': limit };
    }

    return generic(
      url,
      params,
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
    if (!isObject(skill)) { return false; }
    cb = cb || {};

    return ajax({
      url: routes.skills.url,
      type: 'POST',
      contentType: 'application/json',
      data: skill,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
      }
    });
  };
  /** skill.modify
      args: skill - (Skill object) original skill object for the skill being
              modified
            details - (hash table) describes the new properties of the skill, must
              include the 'url' property of an existing skill

    Takes the hash table and tries to send it to the backend as a modification set
    on the skill passed in.
   **/
  lib.skill.modify = function (skill, details, cb) {
    if (!isObject(skill)) { return false; }
    if (!isObject(details)) { return false; }

    cb = cb || {};
    var url = getURL(skill, false);
    if (!url) { return false; }

    return ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json',
      data: details,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
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

    var url = getURL(cls, routes.classes.url);
    if (isObject(cls) && (cls.success || cls.error)) {
      cb = cls;
      var temp = cls.success;

      cb.success = function (data) {
        temp ? temp(lib.utils.convertArray(data)) : "";
      };
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
    if (!isObject(cls)) { return false; }
    cb = cb || {};

    return ajax({
      url: routes.classes.url,
      type: 'POST',
      contentType: 'application/json',
      data: cls,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
      }
    });
  };
  /** classes.modify
      args: class - (Class object) original class object for the class being
              modified
            details - (hash table) describes the new properties of the class, must
              include the 'url' property of an existing class

    Takes the hash table and tries to send it to the backend as a modification set
    on the class passed in.
   **/
  lib.classes.modify = function (cls, details, cb) {
    if (!isObject(cls)) { return false; }
    if (!isObject(details)) { return false; }

    cb = cb || {};
    var url = getURL(cls, false);
    if (!url) { return false; }

    return ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json',
      data: details,
      success: function (data) {
        if (isFunction(cb.success)) { cb.success(data); }
      },
      error: function (msg, xhr) {
        if (isFunction(cb.error)) { cb.error(msg, xhr); }
      }
    });
  };
  // }}}

  // utils {{{
  lib.utils = {};
  /** utils.runFormula
      args: formula - (string) formula to get level+experience for
            min (optional) - (integer) level to start evaluating for
            max (optional) - (integer) level to evaluate up to

      Goes from the `min` level to `max` level and calculates the required
      experience for each level (useful for displaying progress stages).  Returns a
      hash table with the keys being each level and the values the required
      experience.
   **/
  lib.utils.runFormula = function (formula, min, max) {
    if (!max) {
      max = min || 5;
      min = 1;
    }
    // Strip all chars except `n` (hopefully makes formula safe)
    formula = formula.replace(/[A-Za-mo-z\[\]]+/g, "");
    var vals = {};
    try {
      for (var i = min; i <= max; i++) {
        vals[i] = eval("n=" + i + ";" + formula + ";");
      }
    } catch (err) {
      return [];
    }

    return vals;
  };
  /** utils.ajax
    Wrapper for the ajax calls, just providing it for general usage, it takes and
    acts mostly the same as the jQuery ajax call, check the source for differences.
   **/
  lib.utils.ajax = ajax;
  /** utils.convertArray
      args: array - (Array) array of data to convert into hash table
            key (optional) - (string) key of objects to use for keys in table,
              defaults to 'id'

    Will convert the array of objects into a hash table, uses the key param as the
    key to use for the hash table key (defaults to 'id').

    > convertArray([{'foo': 'bar'}, {'foo': 'baz'}], "foo")
    {'bar': {'foo': 'bar'}, 'baz': {'foo': 'baz'}}
   **/
  lib.utils.convertArray = function (array, key) {
    var data = {};
    key = key || "id";

    for (var i = 0, l = array.length; i < l; i++) {
      data[array[i][key]] = array[i];
    }

    return data;
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
