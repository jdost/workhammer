(function () {
  var rpg;

  function setup() {
    if (!window.rpg) { return setTimeout(setup, 100); }
    rpg = window.rpg;
  };

  setup();
}());
