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
    "builder": lib.template(function () {/*
      <form action="javascript:rpg.skill.create;" method="POST"
        enctype="application/json">
        <input type="text" name="name" placeholder="Skill name" />
        <input type="text" name="formula" placeholder="Skill leveling formula" />
        <div class="leveling"></div>
        <input type="submit" value="Create Skill" />
        <button type="button">Close</button>
      </form>
      */}),
    "levels": lib.template(function () {/*
      <% _.each(levels, function (level, index) { %>
        <span>Lvl {{ index }}: {{ level }} XP</span>
      <% }); %>
      */}),
    "list": lib.template(function () {/*
      <% _.each(skills, function (skill) { %>
        <a href="{{ skill.url }}">{{ skill.name }}</a>
      <% }); %>
      */}),
    "read": lib.template(function () {/*
      <h1>{{ name }}</h1>
      <h3>Leaders</h3>
      <button type="button">Close</button>
      */}),
    "leaders": lib.template(function () {/*
      <% _.each(leaders, function (leader) { %>
        <a href="{{ leader.url }}">{{ leader.name }}</a>
      <% }); %>
      */}),
    "edit": lib.template(function () {/*
      <form action="">
        <a href="javascript:;">{{ name }}</a>
        <input type="text" name="name" value="{{ name }}" />
        <a href="javascript:;">Formula: {{ formula }}</a>
        <input type="text" name="formula" value="{{ formula }}" />
        <div class="leveling"></div>
        <input type="submit" value="Update Skill" />
        <button type="button">Close</button>
      </form>
      */})
  };

  var showSkills = function () {
    var win = lib.window("skills list");

    rpg.skill.get({
      "success": function (skills) {
        win.append(templates.list({ "skills": skills }))
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

  var showIndividual = function (url) {
    var win = lib.window("skills single")
     , formulaUpdate = function (input) {
      var vals = rpg.utils.runFormula($(input).val(), 3);
      if (vals.length === 0) { return; }

      win.find(".leveling").empty().append(templates.levels({ "levels": vals }));
    }
     , render = function (skill) {
      var user = window.user.getUser();

      win.append(templates[user.roles.isDM ? "edit" : "read"](skill))
        .render()
        .on("submit", function (evt) {
          rpg.skill.modify(skill, lib.getForm(evt.target), {
            "success": function (data) { win.trigger('success', data); }
          });

          evt.stopPropagation();
          evt.preventDefault();
          return false;
        });
      win.find("a").on("click", function (evt) {
          $(evt.target).hide();
          var input = $(evt.target).next();
          input.show().focus();
          win.find(":submit").show();
          if (input.attr("name") === "formula")
            formulaUpdate(input);
        });
      win.find("input[name=formula]")
        .on("keyup", function (evt) { formulaUpdate(evt.target); });

      rpg.skill.leaders(skill, {
        "success": function (leaders) {
          if (leaders.length) {
            win.find("h3").after(templates.leaders({ "leaders": leaders }));
          } else {
            win.find("h3").remove();
          }
        }
      });
      win.find("button[type=button]").click(win.close);
    };

    rpg.skill.get(url, { "success": render });
    win.on("success", function (evt, skill) {
      win.empty();
      render(skill);
    });
  };

  var showBuilder = function () {
    var win = lib.window("skills builder");

    var formulaUpdate = function (evt) {
      var vals = rpg.utils.runFormula($(evt.target).val(), 3);
      if (vals.length === 0) { return; }  // Leave if no values generated

      var display = win.find(".leveling").empty().append(templates.levels({
        "levels": vals
      }));
    };

    win.append(templates.builder());

    win.render()
      .on("success", win.close)
      .find("input[name=formula]").on("keyup", formulaUpdate);
  };
}(window.skills = {}));
