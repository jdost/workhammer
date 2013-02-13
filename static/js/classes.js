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
    "list": lib.template(function () {/*
      <% _.each(classes, function (cls) { %>
        <a href="{{ cls.url }}">{{ cls.name }}</a>
      <% }); %>
      */}),
    "builder": lib.template(function () {/*
      <form action="javascript:rpg.classes.create;" method="POST"
        enctype="application/json">
        <input type="text" name="name" placeholder="Class name" />
        <input type="text" name="formula" placeholder="Class leveling formula" />
        <div class="leveling"></div>

        <button type="add">Add Skill</button>
        <input type="submit" value="Create Class" />
      </form>
      */}),
    "levels": lib.template(function () {/*
      <% _.each(levels, function (level, index) { %>
        <span>Lvl {{ index }}: {{ level }} XP</span>
      <% }); %>
      */}),
    "skills": lib.template(function () {/*
      <form action="">
        <select name="skill_id">
        <% _.each(skills, function (skill) %>
          <option value="{{ skill.id }}">{{ skill.name }}</option>
        <% }); %>
        <input type="text" name="bonus" placeholder="XP per Skill level" />
        <input type="submit" value="Add skill" />
        <button type="cancel">Cancel</button>
      </form>
      */}),
    "skillList": lib.template(function () {/*
      <div class="skill">{{ name }}: {{ bonus }} XP/Level</div>
      <input type="hidden" name="skills.{{ id }}" value="{{ bonus }}" />
      */})
  };

  var showClasses = function () {
    var win = lib.window("classes list");

    rpg.classes.get({
      "success": function (classes) {
        win.append(templates.list({ "classes": classes }))
          .on("click", "a", function (evt) {
            var anchor = $(evt.target);
            console.log(anchor.attr("href"));

            evt.stopPropagation();
            evt.preventDefault();
            return false;
          })
          .render();
      }
    });
  };

  var skills;
  var showBuilder = function () {
    var win = lib.window("classes builder");

    var skillBuilder = function (evt) {
      var skillWin = lib.window("classes skillChooser");

      if (!skills) {
        rpg.skill.get({
          "success": function (skills_) {
            skills = skills_;
            skillWin.append(templates.skills({ "skills": skills }))
              .center()
              .focus();
          }
        });
      } else {
        skillWin.append(templates.skills({ "skills": skills }));
      }

      skillWin.render()
        .on("submit", function (evt) {
          var select = skillWin.find("select");
          var input = templates.skillList({
            "id": select.val(),
            "name": skills[select.val()].name,
            "bonus": skillWin.find("input[name=bonus]").val()
          });
          win.find("h3").after(input);

          skillWin.close();
          $(evt.target).focus();
        });
    };

    var formulaUpdate = function (evt) {
      var vals = rpg.utils.runFormula($(evt.target).val(), 3);
      if (vals.length === 0) { return; }  // Leave if no values generated

      var display = win.find(".leveling").empty().append(templates.levels({
        "levels": vals
      }));
    };

    win.append(templates.builder())
      .on("keyup", "input[name=formula]", formulaUpdate);

    win.render()
      .on("success", win.close)
      .on("click", "button[type=add]", skillBuilder);
  };
}(window.classes = {}));
