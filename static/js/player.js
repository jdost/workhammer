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
        <textarea name="bio" placeholder="Player bio"></textarea>
        <input type="submit" name="Create" value="Create" />
      </form>
      */}),
    "viewer": lib.template(function () {/*
        <img>
        <div class="profile">
          <div class="info">
            <h1>{{ name }}</h1>
            <h3>level {{ level }}</h3>
            <a href="javascript:;" name="bio">bio</a>
          </div>
        </div>

        <ul class="classes">
          <h3>Classes</h3>
          <% _.each(classes, function (cls) { %>
            <a href="#{{ cls.url }}">
              <li>{{ cls.name }}: {{ cls.level }}</li>
              <% print(window.lib.progressBar(cls.points, cls.edges[0], cls.edges[1])) %>
            </a>
          <% }); %>
        </ul>

        <ul class="skills">
          <h3>Skills</h3>
          <% _.each(skills, function (skill) { %>
            <a href="#{{ skill.url }}">
              <li>{{ skill.name }}: {{ skill.level }}</li>
              <% print(window.lib.progressBar(skill.points, skill.edges[0], skill.edges[1])) %>
            </a>
          <% }); %>
        </ul>

        <ul class="quests">
          <h3>Quests</h3>
          <% _.each(quests, function (quest) { %>
            <li>
              <a href="javascript:;">{{ quest.name }}</a>
            </li>
          <% }); %>
        </ul>
      */}),
    "bio": lib.template(function () {/*
      <h1>{{ name }}</h1>
      <div>{{ bio }}</div>
      <button type="cancel">Close</button>
      */})
  };

  var showBuilder = function () {
    var win = lib.window("player builder");

    win.append(templates.builder());

    win.render()
      .on("success", showPlayer)
      .on("success", window.user.reload)
      .on("success", win.remove);
  };

  var showPlayer = exports.showPlayer = function (player) {
    var win = lib.window("player viewer single");
    var edittable = typeof player !== "object";
    var player, quests, skills, classes;
    var render = function () {
      if (!_.all([player, quests, skills, classes])) { return; }
      player = _.defaults(player, {
        "level": 0,
        "skills": {},
        "classes": {}
      });
      // "process" player, i.e. replace id references with simple objects
      player.skills = _.map(player.skills, function (skill, id) {
        skill.edges = _.values(rpg.utils.runFormula(skills[id].formula,
          skill.level, skill.level+1));
        return _.defaults(skill, skills[id]);
      });
      player.quests = {}; // Not implemented
      player.classes = _.map(player.classes, function (cls, id) {
        cls.edges = _.values(rpg.utils.runFormula(classes[id].formula,
          cls.level, cls.level+1));
        return _.defaults(cls, classes[id]);
      });

      var showBio = function () {
        var bioWin = lib.window("player bio");
        bioWin.append(templates.bio(player))
          .render();
      };

      win.append(templates.viewer(player))
        .on("click", "a", function (evt) {
          var anchor = $(evt.target);
          if (anchor.attr("name") === "bio") {
            return showBio();
          }

          var target = anchor.attr("href").replace("#", "");
          if (anchor.parent().hasClass("skills")) {
            window.skills.show(target);
          } else if (anchor.parent().hasClass("classes")) {
            window.classes.show(target);
          }

          evt.preventDefault();
          evt.stopPropagation();
          return false;
        })
        .center()
        .focus();
      };

    if (!player) { player = window.user.getUser().player; }

    rpg.player.get(player, { success: function (p) { player = p; render(); } });
    rpg.quest.get({ success: function (q) { quests = q; render(); } });
    rpg.skill.get({ success: function (s) { skills = s; render(); } });
    rpg.classes.get({ success: function (c) { classes = c; render(); } });

    win.render()
      .on("success", function (p) {
        win.close();
        showPlayer(p);
      });
  };
}(window.player = {}));
