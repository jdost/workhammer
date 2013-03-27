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
        window.app.sfx.play("move");
        var id = els.index($(":focus").first()) + (evt.which === 40 ? 1 : -1);
        if (id < 0) { id = els.length-1; }
        else if (id >= els.length) { id = 0; }
        els[id].focus();

        if (evt.target.nodeName === 'SELECT') { evt.preventDefault(); }
      }
    });
  };

  window.rpg.ready(setup);
  window.app = {};

  (function (exports) {
    var clips = {};

    $(document).ready(function () {
      $("audio").each(function () {
        var el = this;
        clips[el.getAttribute("name")] = el;
      });
    });

    exports.play = function (name) {
      if (!clips[name]) { return; }
      var clip = clips[name];

      clip.pause();
      clip.currentTime = 0;
      clip.play();
    };
  }(window.app.sfx = {}));

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
