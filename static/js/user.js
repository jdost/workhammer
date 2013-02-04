(function (exports) {
  var rpg = window.rpg,
    lib = window.lib,
    win,
    user = false,
    loggedIn = false;

  rpg.ready(function () {
    loggedIn = rpg.loggedIn();
    if (loggedIn) { rpg.user.get({ success: buildUser }); }
  });
  var buildUser = function (u) {
    user = u;
    user.roles = {
      "raw": u.role,
      "isPlayer": u.role.indexOf("PLAYER") > -1,
      "isDM": u.role.indexOf("ROOT") > -1 || u.role.indexOf("ADMIN") > -1
    };
  };
  exports.getUser = function () { return user; };
  // Menu listing creation
  window.menu.add("Login", {
    "exec": function () { return showLogin(); },
    "show": function () {
      return !loggedIn;
    }
  });
  window.menu.add("Logout", {
    "exec": function () {
      rpg.user.logout({
        success: function () {
          loggedIn = false;
          user = false;
          window.app.loggedOut();
        }
      });
    },
    "show": function () {
      return loggedIn;
    }
  });
  // Template definition
  var templates = {
    "loginForm": lib.template(function () { /*
        <form action="javascript:rpg.user.login;">
        <input type="text" name="username" placeholder="username" />
        <input type="password" name="password" placeholder="password" />
        <input type="submit" name="Login" value="Login" />
      </form>
      <div class="message"></div>
      <a id="register" href="javascript:;">Register</a>
      */}),
    "registerForm": lib.template(function () { /*
        <form action="javascript:rpg.user.register;">
        <input type="text" name="username" placeholder="username" />
        <input type="password" name="password" placeholder="password" />
        <input type="password" name=".match" placeholder="repeat password" />
        <input type="submit" name="Register" value="Register" />
      </form>
      <div class="message"></div>
      */})
  };

  var showLogin = function () {
    if (win) { win.close(); } // Remove the login window
    var loginWindow = lib.window("login");

    loginWindow.append(templates.loginForm())
      .on('success', function (evt, data) { handleLogin(data); })
      .on('error', function (evt, msg) {
        win.find(".message").text(msg.responseText);
      })
      .children("#register").click(showRegister);

    loginWindow.render();
    win = loginWindow;
  };

  var showRegister = function () {
    if (win) { win.close(); } // Remove the login window
    var regWindow = lib.window("register");

    regWindow.append(templates.registerForm())
      .on('success', function (evt, data) {
        rpg.user.get({
          success: handleLogin
        });
      })
      .on('error', function (evt, msg) {
        win.find(".message").text(msg.responseText);
      });

    regWindow.find("form").on("submit", function (evt) {
      var self = $(evt.target);
      var pws = self.find(":password");

      if (pws[0].value !== pws[1].value) {
        regWindow.find(".message").text("Passwords must match");
        evt.stopImmediatePropagation();
        return false;
      }
    });

    regWindow.render();
    win = regWindow;
  };

  var handleLogin = function (data) {
    loggedIn = true;
    buildUser(_.isArray(data) ? data[0] : data);
    app.loggedIn();
    win.close();
  };
}(window.user = {}));
