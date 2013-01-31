(function (exports) {
  var lib = window.lib,
    rpg = window.rpg;
  // Menu listing creation
  window.menu.add("Create Player", {
    "exec": function () { return showBuilder(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return !user.role.isPlayer;
    }
  })
  .add("Edit Player", {
    "exec": function () { return showPlayer(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.role.isPlayer;
    }
  });
  // Template definition
  var templates = {
    "builder": lib.template(function () {/*
      <form action="javascript:rpg.player.create;" method="POST"
          enctype="application/json">
        <input type="text" name="name" placeholder="Player Name" />
        <input type="submit" name="Create" value="Create" />
      </form>
      */}),
    "viewer": lib.template(function () {/*
      <h1>{{ name }}</h>
      <div></div>
      */})
  };

  var showBuilder = function () {
    var win = lib.window("player builder");

    win.append(templates.builder());

    win.render()
      .bind("success", showPlayer)
      .bind("success", win.remove);
  };

  var showPlayer = exports.showPlayer = function () {
    var win = lib.window("player viewer");

    rpg.player.get({
      success: function (player) {
        win.append(templates.viewer(player[0]));
      }
    });

    win.render();
  };
}(window.player = {}));
