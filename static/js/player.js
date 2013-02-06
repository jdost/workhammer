(function (exports) {
  var lib = window.lib,
    rpg = window.rpg;
  // Menu listing creation
  window.menu.add("Create Player", {
    "exec": function () { return showBuilder(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return !user.roles.isPlayer;
    }
  })
  .add("Edit Player", {
    "exec": function () { return showPlayer(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.roles.isPlayer;
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
      .on("success", showPlayer)
      .on("success", win.remove);
  };

  var showPlayer = exports.showPlayer = function (player) {
    var win = lib.window("player viewer");

    if (!player) { player = window.user.getUser().player; }

    rpg.player.get(player, {
      success: function (player) {
        win.append(templates.viewer(player));
      }
    });

    win.render();
  };
}(window.player = {}));