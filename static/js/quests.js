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
        <button type="cancel">Close</button>
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
        <button type="cancel">Close</button>
      </form>
      */}),
    "rewardList": lib.template(function () {/*
      <div class="reward">{{ name }} +{{ reward }} SP</div>
      <input type="number" name="rewards.skills.{{ id }}" value="{{ reward }}" />
      */}),
    "list": lib.template(function () {/*
      <% _.each(quests, function (quest, index) { %>
        <a href="{{ quest.url }}">{{ quest.name }}</a>
      <% }); %>
      <button type="cancel">Close</button>
      */}),
    "read": lib.template(function () {/*
      <h1>{{ name }}</h1>
      <div>{{ description }}</div>
      <% if (request) { %>
        <button type="request">Request</button>
      <% } %>
      <button type="cancel">Close</button>
      */}),
    "edit": lib.template(function () {/*
      <form action="">
        <a href="javascript:;"><h1>{{ name }}</h1></a>
        <input type="text" name="name" value="{{ name }}" />
        <a href="javascript:;"><div>{{ description }}</div></a>
        <textarea name="description">{{ description }}</textarea>
        <!-- Rewards List -->
        <input type="submit" value="Update" />
        <% if (request) { %>
          <button type="request">Request</button>
        <% } %>
        <button type="cancel">Close</button>
      </form>
      */}),
    "pendingList": lib.template(function () {/*
      <h1>Pending Quests</h1>
      <% _.each(requests, function (request, index) { %>
        <a href="javascript:;" data-index={{ index }}>
          {{ request.quest.name }} - {{ request.player.name }}
        </a>
      <% }); %>
      <button type="cancel">Close</button>
      */}),
    "confirm": lib.template(function () {/*
      <h3>Confirm completion?</h3>
      <div>Player: {{ player.name }}</div>
      <div>Quest: {{ quest.name }}</div>
      <button type="confirm">Confirm</button>
      <button type="cancel">Cancel</button>
      */})
  };

  var showIndividual = function (url) {
    var win = lib.window("quests single")
     , render = function (quest) {
      var user = window.user.getUser(), player;

      quest.request = typeof user.player !== 'undefined';
      if (user.player) {
        rpg.player.get(user.player, {
          "success": function (p) { player = p; }
        });
      }

      win.append(templates[user.roles.isDM ? "edit" : "read"](quest))
        .render()
        .on("submit", function (evt) {
          rpg.quest.modify(quest, lib.getForm(evt.target), {
            "success": function (data) { win.trigger('success', data); }
          });

          evt.stopPropagation();
          evt.preventDefault();
          return false;
        })
        .on("click", "button[type=request]", function (evt) {
          rpg.player.quest(player, quest, { "success": win.close });
        })
        .on("click", "a", function (evt) {
          var anchor = $(evt.target);
          anchor.hide().next().show().focus();
          win.find("input[type=submit]").show();
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
              .focus();
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
    var win = lib.window("quests pending");
    var requests, players, quests;

    var render = function () {
      if (_.isUndefined(requests) || _.isUndefined(players)
          || _.isUndefined(quests)) { return; }
      requests = _.map(requests, function (req) {
        req.player = players[req.player.id];
        req.quest = quests[req.quest.id];
        return req;
      });
      win.append(templates.pendingList({ "requests": requests }))
        .render()
        .on("click", "a", function (evt) {
          var request = requests[parseInt($(evt.target).attr("data-index"))];
          var confirmWindow = lib.window("quests confirm");

          confirmWindow.append(templates.confirm(request))
          .render()
          .on("click", "button", function (evt) {
            var button = $(evt.target);
            if (button.attr("type") === "confirm") {
              rpg.quest.complete(request, { "success": confirmWindow.close });
            } else {
              confirmWindow.close();
            }
          });
        });
    };

    rpg.quest.pending({ "success": function (r) {
      requests = r;
      render();
    } });
    rpg.quest.get({ "success": function (q) {
      quests = q;
      render();
    } });
    rpg.player.get({ "success": function (p) {
      players = p;
      render();
    } });
  };
}(window.quests = {}));
