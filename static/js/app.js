(function () {
  var rpg,
    starterText;

  function setup() {
    rpg = window.rpg;
    start = $(document.body).find("#start");

    $(document.body).on("keydown", function (evt) {
      if (evt.which === 27) { // Esc
        if (start) {
          start.hide();
          start = false;
        }
        window.menu.toggle();
      } else if (evt.which === 40 || evt.which === 38) { // Arrows
        var els = $(".window").last().find("a, :input, select").filter(":visible");
        if (els.length === 0) { return; }
        var id = els.index($(":focus").first()) + (evt.which === 40 ? 1 : -1);
        if (id < 0) { id = els.length-1; }
        else if (id >= els.length) { id = 0; }
        els[id].focus();
      }
    });
  };

  window.rpg.ready(setup);
  window.app = {};

  window.app.loggedIn = function () {
    var user = window.user.getUser();
    if (!user) { return; }

    if (user.roles.isPlayer) {
      window.player.showPlayer();
    } else {
      window.menu.show();
    }
  };

  window.app.loggedOut = function () {
    $(".container").remove();
    start = $(document.body).find("#start");
    start.show();
  };
}());
