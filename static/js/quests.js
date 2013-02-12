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
      */}),
    "list": lib.template(function () {/*
      <% _.each(quests, function (quest, index) { %>
        <a href="{{ quest.url }}">{{ quest.name }}</a>
      <% }); %>
      */}),
    "read": lib.template(function () {/*
      <h1>{{ name }}</h1>
      <div>{{ description }}</div>
      */}),
    "edit": lib.template(function () {/*
      <form action="">
        <a href="javascript:;"><h1>{{ name }}</h1></a>
        <input type="text" name="name" value="{{ name }}" />
        <a href="javascript:;"><div>{{ description }}</div></a>
        <textarea name="description">{{ description }}</textarea>
        <input type="submit" value="Update Quest" />
      </form>
      */})
  };

  var showIndividual = function (url) {
    var win = lib.window("quests single")
     , render = function (quest) {
      var user = window.user.getUser();

      win.append(templates[user.roles.isDM ? "edit" : "read"](quest))
        .render()
        .on("submit", function (evt) {
          rpg.quest.modify(quest, lib.getForm(evt.target), {
            "success": function (data) { win.trigger('success', data); }
          });

          evt.stopPropagation();
          evt.preventDefault();
          return false;
        });
      };

    rpg.quest.get(url, { "success": render });
    win.on("success", function (evt, quest) {
      win.empty();
      render(quest);
    });
  };

  var showQuests = function () {
    var win = lib.window("quests list");

    rpg.quest.get({
      "success": function (quests) {
        win.append(templates.list({ "quests": quests }))
          .focus()
          .find("a").each(function (index, el) {
            $(el).click(function (evt) {
              showIndividual($(el).attr("href"));
              evt.preventDefault();
              evt.stopPropagation();
              return false;
            });
          });
      }
    });

    win.render();
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
