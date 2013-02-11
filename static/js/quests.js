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
      return user.roles.isDM;
    }
  })
  .add("Pending Quests", {
    "exec": function () { return showPendingQuests(); },
    "show": function () {
      var user = window.user.getUser();
      if (!user) { return false; }
      return user.roles.isDM;
    }
  });
  // Template definition
  var templates = {
    "builder": lib.template(function () {/*
      <form action="javascript:rpg.quest.create;" method="POST"
        enctype="application/json">
        <input type="text" name="name" placeholder="Quest name" />
        <textarea name="description" placeholder="description"></textarea>
        <h3>Rewards</h3>
        <input type="button" value="Add Reward" />
        <input type="submit" value="Create Quest" />
      </form>
      */}),
    "rewards": lib.template(function () {/*
      <form action="">
        <select name="skill_id">
          <% _.each(skills, function (skill) { %>
          <option value="{{ skill.id }}">{{ skill.name }}</option>
          <% }); %>
        </select>
        <input type="text" name="reward"  placeholder="SP reward" />
        <input type="submit" value="Add reward" />
      </form>
      */}),
    "rewardList": lib.template(function () {/*
      <div class="reward">{{ name }} +{{ reward }} SP</div>
      <input type="hidden" name="rewards.skills.{{ id }}" value="{{ reward }}" />
      */})
  };

  var showQuests = function () {
  };

  var skills;
  var showBuilder = function () {
    var win = lib.window("quests builder");

    var rewardBuilder = function (evt) {
      var choiceWin = lib.window("quests reward");

      if (!skills) {
        rpg.skill.get({
          "success": function (skills_) {
            skills = skills_;
            choiceWin.append(templates.rewards({ "skills": skills }))
              .center()
              .find("select").focus();
          }
        });
      } else {
        choiceWin.append(templates.rewards({ "skills": skills }));
      }

      choiceWin.render()
        .on("submit", function (evt) {
          var select = choiceWin.find("select");
          var input = templates.rewardList({
            "id": select.val(),
            "name": select.find(":selected").text(),
            "reward": choiceWin.find("input[name=reward]").val()
          });
          win.find("h3").after(input);

          choiceWin.close();
          $(evt.target).focus();
        });
    };

    win.append(templates.builder());

    win.render()
      .on("success", win.close)
      .find("input[type=button]").on("click", rewardBuilder);
  };

  var showPendingQuests = function () {
  };
}(window.quests = {}));
