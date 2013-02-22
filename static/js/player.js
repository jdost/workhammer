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
  .add("Edit Player", {
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

        <div class="playerProfile">
          <div class="playerProfileImg"></div>
          <div class="playerProfileInfo">
            <div class="playerNameBioWrapper">
              <span class="playerName">{{ player.name }}</span>
              <span class="playerBio">bio</span>
              <span class="playerLevel">level {{ player.level }}</span>
            </div
            <div class="playerClasses">
              <% _.each(classes, function (cl) { %>
                <div class="playerClass">
                  <div class="playerClassImg"></div>
                  <a class="playerClassName" href="{{ cl.url }}">{{ cl.name }}: {{ cl.level }}</a>
                  <progress class="playerClassProgress" value="{{ cl.progress }}" max="1"></progress>
                </div>
              <% }); %>
            </div>
          </div>
        </div>

        <div class="playerSkillsWrapper">
          <div class="playerSkillsHeader">Skills</div>
          <div class="playerSkills">
            <% _.each(skills, function (skill) { %>
              <div class="playerSkill">
                <div class="playerSkillImg"></div>
                <a class="playerSkillName" href="{{ skill.url }}">{{ skill.name }}: {{ skill.level }}</a>
                <progress class="playerSkillProgress" value="{{ skill.progress }}" max="1"></progress>
              </div>
            <% }); %>
          </div>
        </div>

        <div class="playerQuestsWrapper">
          <div class="playerQuestsHeader">Quests</div>
          <div class="playerQuests">
            <% _.each(quests, function (quest) { %>
              <div class="playerQuest">
                <div class="playerQuestImg"></div>
                <a class="playerQuestName" href="{{ quest.url }}">{{ quest.name }}</a>
              </div>
            <% }); %>
          </div>
        </div>

      */})
  };

  //placeholders
  var placeholders = {
    player: {
      bioLink: '#',
      level: 0,
      img: '',
      name: 'player name'
    },
    classes: [
      {name: 'Programmer', progress: 0.4, level: 0, url: '#', img: ''},
      {name: 'DBA', progress: 0.8, level: 0, url: '#', img: ''}
    ],
    skills : [
      {name: 'Tester', progress: 0.5, level: 0, url: '#', img: ''},
      {name: 'Front End', progress: 0.2, level: 0, url: '#', img: ''},
      {name: 'Joke Teller', progress: 0.9, level: 0, url: '#', img: ''}
    ],
    quests: [
      {name: 'quest 1', url: '#', img: ''},
      {name: 'quest 2', url: '#', img: ''},
      {name: 'quest 3', url: '#', img: ''}
    ]
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

    if (!player) { player = window.user.getUser().player; }

    rpg.player.get(player, {
      success: function (player) {
        win.append(templates.viewer(placeholders));
      }
    });

    win.render();
  };
}(window.player = {}));
