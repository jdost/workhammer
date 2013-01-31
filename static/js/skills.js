(function (exports) {
  var lib = window.lib,
    rpg = window.rpg;
  // Menu listing definition
  window.menu.add("View Skills", {
    "exec": function () { return showSkills(); }
  })
  .add("Create Skill", {
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

  var showSkills = function () {
  };

  var showBuilder = function () {
  };
}(window.skills = {}));
