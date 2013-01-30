(function (exports) {
  var lib = window.app.lib;
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

  exports.showBuilder = function () {
    var win = lib.window("player builder");

    win.append(templates.builder());

    $(document.body).append(win);
    win.bind("success", exports.showPlayer)
      .bind("success", function () { win.remove(); });
  };

  exports.showPlayer = function () {
    var win = lib.window("player viewer");

    rpg.player.get({
      success: function (player) {
        win.append(templates.viewer(player[0]));
      }
    });

    $(document.body).append(win);
  };

  exports.editPlayer = {
    "activate": function () {
    }
  };
}(window.player = {}));
