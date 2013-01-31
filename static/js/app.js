(function () {
  var rpg;

  function setup() {
    rpg = window.rpg;
    var starterText = $(document.body).find("#start");

    $(document.body).bind("keydown", function (evt) {
      if (evt.which === 27) { // Esc
        if (starterText) {
          starterText.remove();
          starterText = false;
        }
        window.menu.toggle();
      } else if (evt.which === 40 || evt.which === 38) { // Arrows
        var els = $("a, :input");
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
    }
  };
}());
