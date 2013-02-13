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
  var templates = {"builder": lib.template(function () {/*
      <form action="javascript:rpg.quest.create;" method="POST"
          enctype="application/json">
        <input type="text" name="name" placeholder="Quest Name" />
        <input type="text" name="description" placeholder="Quest Description" />
        <input type="hidden" class="repeatable" name="repeatable" value="false" />
        Rewards <br>
        <div class="rewardsDiv">
        blah blah 
        </div>
            <select name="skill_id">
          <% _.each(skills, function (skill) { %>
          <option value="{{ skill.id }}">{{ skill.name }}</option>
          <% }); %>
        </select>

        <input type="button" id="addReward" class="addReward" value="Add New Reward"/>
        <input type="submit" name="Create" value="Create" />
      </form>
      */}),"viewer": lib.template(function () {/*
      <h1>{{ name }}</h>
      <div></div>
      */})

  };

  var showQuests = function () {
  };

  var showBuilder = function () {
    var win = lib.window("quest builder");
    var rewardString = "";
    win.append(templates.builder());

    choiceWin = lib.window("repeatable");
    lib.el("a")
        .attr("href", "javascript:;")
        .on("click", function (evt) {
          jQuery('.repeatable').val('true');
          choiceWin.close();
        }).text('Repeatable')
        .appendTo(choiceWin);
    lib.el("a")
        .attr("href", "javascript:;")
        .on("click", function (evt) {
          jQuery('.repeatable').val('false');
          choiceWin.close();
        }).text('One Time')
        .appendTo(choiceWin); 
    win.render()
      .on("success", win.remove);


    jQuery('.addReward').click(function(){
      rewardString = '<input type="text" name="skill" placeholder="Skill" />';
      rewardString += '<input type="text" name="experience" placeholder="Experience" />';
      jQuery('.rewardsDiv').append(rewardString);


    });
    choiceWin.render();


  };

  var showPendingQuests = function () {
  };
}(window.quests = {}));
