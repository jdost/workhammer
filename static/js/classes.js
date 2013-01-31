(function (exports) {
  var lib = window.lib,
    rpg = window.rpg;
  // Menu listing definition
  window.menu.add("View Classes", {
    "exec": function () { return showClasses(); }
  })
  .add("Create Class", {
    "exec": function () { return showBuilder(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.roles.isDM;
    }
  });
  // Templates
  var templates = {
  };

  var showClasses = function () {
  };

  var showBuilder = function () {
  };
}(window.classes = {}));
