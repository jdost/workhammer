(function () {
  var rpg;

  function setup() {
    if (!window.rpg) { return setTimeout(setup, 100); }
    if (!window.rpg.isReady()) { return setTimeout(setup, 100); }
    rpg = window.rpg;
    if (!rpg.loggedIn()) { app.user.showLogin(); }
    else {
      rpg.user.get({
        "success": app.loggedIn,
        "error": function () {
          rpg.user.logout({
            "success": app.user.showLogin
          });
        }
      });
    }

    $(document.body).bind("keydown", function (evt) {
      if (evt.which === 27) {
        app.menu.show();
      }
    });
  };

  $(document).ready(setup);
  window.app = {};

  window.app.loggedIn = (function () {
    var actions = {
      "createPlayer": function (user) {
          window.player.showBuilder();
        },
      "view": function (user) {
          window.player.showPlayer();
        },
      "viewQuests": function (user) {
          quests.showQuests();
        },
      "viewSkills": function (user) {
          skills.showSkills();
        },
      "viewClasses": function (user) {
          classes.showClasses();
        },
      "questLog": function (user) {
          quests.showPendingQuests();
        }
    };

    return function (user) {
      var templates = {
        "createPlayer": app.lib.template(function () { /*
          <li alt="createPlayer">Create new player</li>
          */}),
        "PLAYER": app.lib.template(function () { /*
          <li alt="view">View Player</li>
          */}),
        "_": app.lib.template(function () {/*
          <li alt="viewQuests">View Quests</li>
          <li alt="viewSkills">View Skills</li>
          <li alt="viewClasses">View Classes</li>
          */}),
        "DM": app.lib.template(function () {/*
          <li alt="questLog">Approve Quests</li>
          */})
      };

      window.app.menu.add("Logout", app.user.logout);
      var playerMenu = app.lib.window("options");

      var options = app.lib.el("ul").appendTo(playerMenu);
      if (user.role.indexOf("PLAYER") > -1) {
        options.append(templates["PLAYER"]());
        window.app.menu.add("Edit player", window.app.user.editUser);
      } else {
        options.append(templates["createPlayer"]());
      }
      options.append(templates["_"]());
      if (user.role.indexOf("ROOT") > -1 ||
        user.role.indexOf("ADMIN") > -1) {
        options.append(templates["DM"]());
      }

      $(document.body).append(playerMenu);
      playerMenu.find("li").bind("click", function (evt) {
        actions[$(evt.target).attr("alt")](user);
        playerMenu.remove();
      });
    }
  }());

  window.app.menu = (function () {
    var exports = {};
    var entries = {},
      win;

    var templates = {
      "entry": function () {/*
        <li>{{ label }}</li>
      */}
    };

    exports.add = function (label, descr) {
      entries[label] = descr;
    };

    exports.remove = function (label) {
      delete(entries[label]);
    };

    exports.show = function () {
      if (win) {
        win.remove();
        win = false;
        return;
      }

      win = app.lib.window("menu");
      var tmpl = app.lib.template(templates.entry),
        list = app.lib.el("ul");

      _.each(entries, function (e, label) {
        list.append(tmpl({"label": label}));
      });

      win.append(list);

      $(document.body).append(win);
      win.find("li").bind("click", function (evt) {
        var entry = entries[$(evt.target).text()];
        entry.activate();
      });
    };

    exports.close = function () {
      if (win) {
        win.remove();
        win = false;
      }
    };

    return exports;
  }());
}());
