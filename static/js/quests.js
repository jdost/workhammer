(function (exports) {
  var lib = window.lib,
    rpg = window.rpg;
  // Menu listing creation
  window.menu.add("View Quests", {
    "exec": function () { return showQuests(); }
  })
  .add("Create Quest", {
    "exec": function () { return showBuilder(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.role.isDM;
    }
  })
  .add("Pending Quests", {
    "exec": function () { return showPendingQuests(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.role.isDM;
    }
  });
  // Template definition
  var templates = {
  };

  var showQuests = function () {
  };

  var showBuilder = function () {
  };

  var showPendingQuests = function () {
  };
}(window.quests = {}));
