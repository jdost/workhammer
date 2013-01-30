window.app.user = (function (rpg) {
  var exports = {},
    self = this,
    lib = app.lib,

    win;

  var templates = {
    "loginForm": lib.template(function () { /*
        <form action="javascript:rpg.user.login;">
        <input type="text" name="username" placeholder="username" />
        <input type="password" name="password" placeholder="password" />
        <input type="submit" name="Login" value="Login" />
      </form>
      <div class="message"></div>
      <a id="register">Register</a>
      */}),
    "registerForm": lib.template(function () { /*
        <form action="javascript:rpg.user.register;">
        <input type="text" name="username" placeholder="username" />
        <input type="password" name="password" placeholder="password" />
        <input type="submit" name="Register" value="Register" />
      </form>
      <div class="message"></div>
      */})
  };

  var handleRegister = function (event) {
    var pws = $(this).find(":password");
    if (pws[0].valueOf() !== pws[1].valueOf()) {
      return actFailure("Passwords don't match.");
    }

    var data = lib.getForm(this);

    rpg.user.register(data, {
      success: loginSuccess,
      error: actFailure
    });

    return false;
  };

  exports.showLogin = function () {
    var loginWindow = lib.window("login");

    loginWindow.append(templates.loginForm())
      .bind('success', loginSuccess)
      .bind('error', actFailure)
      .children("#register").click(exports.showRegister);

    $(document.body).append(loginWindow);
    win = loginWindow;
  };

  exports.showRegister = function () {
    win.remove();
    var regWindow = lib.window("register");

    regWindow.append(templates.registerForm())
      .bind('success', registerSuccess)
      .bind('error', actFailure);

    $(document.body).append(regWindow);
    win = regWindow;
  };

  var logout = exports.logout = {
    "activate":  function () {
      rpg.user.logout({
        success: function () {
          app.menu.close();
          app.menu.remove("Logout");
        }
      });
    }
  }

  var loginSuccess = function (evt, data) {
    app.loggedIn(data);
    win.remove();
  };
  var registerSuccess = function (evt, data) {
    rpg.user.get({
      success: function (d) {
        app.loggedIn(d);
        win.remove();
      }
    });
  };

  var actFailure = function (evt, msg) {
    msg = msg.responseText;
    win.find(".message").text(msg);
  };

  return exports;
}(window.rpg));
