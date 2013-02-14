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
  .add("View Player", {
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
      */}),
    "editor": lib.template(function () {/*
      <form action="">
        <a href="javascript:;">
          <h1>{{ name }}</h1>
        </a>
        <input type="text" name="name" value="{{ name }}" />

        <input type="submit" value="Update Player" />
        <button type="cancel">Cancel</button>
      </form>
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
    var edittable = typeof player !== "object";

    if (!player) { player = window.user.getUser().player; }

    rpg.player.get(player, {
      success: function (player) {
        win.append(templates[edittable ? "editor" : "viewer"](player))
          .on("submit", function (evt) {
            rpg.player.modify(player, lib.getForm(evt.target), {
              "success": function (data) { win.trigger('success', data); }
            });

            evt.stopPropagation();
            evt.preventDefault();
            return false;
          })
          .on("click", "a", function (evt) {
            var anchor = $(evt.target);
            anchor.hide()
              .next().show().focus();
            win.find("input[type=submit]").show();
          });
      }
    });

    win.render()
      .on("success", function (p) {
        win.close();
        showPlayer(p);
      });
  };
}(window.player = {}));
