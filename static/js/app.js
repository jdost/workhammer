(function () {
  var rpg;

  function setup() {
    if (!window.rpg) {
      return setTimeout(setup, 100);
    }

    rpg = window.rpg;

    rpg.bind(rpg.EVENTS.READY, function (isLoggedIn) { });
  };

  setup();
}());
