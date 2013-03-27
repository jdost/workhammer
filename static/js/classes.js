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
      <button type="cancel">Close</button>
      */}),
    "builder": lib.template(function () {/*
      <form action="javascript:rpg.classes.create;" method="POST"
        enctype="application/json">
        <input type="text" name="name" placeholder="Class name" />
        <input type="text" name="formula" placeholder="Class leveling formula" />
        <div class="leveling"></div>

        <h3>Class skills</h3>
        <button type="add">Add Skill</button>
        <input type="submit" value="Create Class" />
        <button type="cancel">Close</button>
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
        <% _.each(skills, function (skill) { %>
          <option value="{{ skill.id }}">{{ skill.name }}</option>
        <% }); %>
        <input type="text" name="bonus" placeholder="XP per Skill level" />
        <input type="submit" value="Add skill" />
        <button type="cancel">Cancel</button>
      </form>
      */}),
    "skillList": lib.template(function () {/*
      <div class="skill">{{ name }}: {{ bonus }} XP/Level</div>
      <input type="number" name="skills.{{ id }}" value="{{ bonus }}" />
      */}),
    "edit": lib.template(function () {/*
      <form action ="">
        <a href="javascript:;"><h1>{{ name }}</h1></a>
        <input type="text" name="name" value="{{ name }}" />
        <a href="javascript:;">Formula: {{ formula }}</a>
        <input type="text" name="formula" value="{{ formula }}" />
        <div class="leveling"></div>
        <!-- Skills list --->
        <input type="submit" value="Update Class" />
        <button type="cancel">Close</button>
      </form>
      */}),
    "read": lib.template(function () {/*
      */})
  };

  var showClasses = function () {
    var win = lib.window("classes list");

    rpg.classes.get({
      "success": function (classes) {
        win.append(templates.list({ "classes": classes }))
          .on("click", "a", function (evt) {
            var anchor = $(evt.target);
            showIndividual(anchor.attr("href"));

            evt.stopPropagation();
            evt.preventDefault();
            return false;
          })
          .render();
      }
    });
  };

  var showIndividual = exports.show = function (url) {
    var win = lib.window("classes single")
     , formulaUpdate = function (input) {
      var vals = rpg.utils.runFormula($(input).val(), 3);
      if (vals.length === 0) { return; }

      win.find(".leveling").empty().append(templates.levels({ "levels": vals }));
    }, render = function (cls) {
        var user = window.user.getUser();

        win.append(templates[user.roles.isDM ? "edit" : "read"](cls))
          .render()
          .on("submit", function (evt) {
            rpg.classes.modify(cls, lib.getForm(evt.target), {
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
        };

    rpg.classes.get(url, { "success": render });
    win.on("success", function (evt, cls) {
      win.empty();
      render(cls);
    });
  };

  var showBuilder = function () {
    var win = lib.window("classes builder");

    var skillBuilder = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      var skillWin = lib.window("classes skillChooser");

      rpg.skill.get({
        "success": function (skills_) {
          skills = skills_;
          skillWin.append(templates.skills({ "skills": skills }))
            .center()
            .focus();
        }
      });

      skillWin.render()
        .on("submit", function (evt_) {
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

      return false;
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
