window.app.lib = (function () {
  var exports = {};

  exports.el = function (type) { return jQuery(document.createElement(type)); };

  exports.window = function (classes) {
    var win = exports.el("div");
    win.addClass("window").addClass(classes);
    win.bind("submit", function (evt) {
      var data = exports.getForm(event.target),
        form = $(event.target);

      if (form.attr("action").indexOf("javascript:") !== -1) {
        var action = form.attr("action"),
          func = window;

        action = action.substring(11, action.indexOf(";")).split(".");

        for (var i = 0, l = action.length; i < l; i++) {
          func = func[action[i]];
        }

        func(data, {
          success: function (data) { form.trigger('success', data); },
          error: function (data) { form.trigger('error', data); }
        });
      } else {
        var url = form.attr("action");
        jQuery.ajax({
          url: url,
          data: data,
          method: form.attr("method"),
          contentType: form.attr("enctype") || "application/x-www-form-urlencoded",
          success: function (data) { form.trigger('success', data); },
          error: function (data) { form.trigger('error', data); }
        });
      }

      return false;
    });
    return win;
  };

  exports.form = function (attrs) {
    var form = exports.el("form").attr(attrs);
    form.bind("submit", function (evt) {
      var data = exports.getForm(this);

      if (form.attr("action").indexOf("javascript:") !== -1) {
        var action = form.attr("action"),
          func = window;

        action = action.substring(11, action.indexOf(";")).split(".");

        for (var i = 0, l = action.length; i < l; i++) {
          func = func[action[i]];
        }

        func(data, {
          success: function (d) { form.trigger('success', d); },
          error: function (d) { form.trigger('error', d); }
        });
      } else {
        var url = form.attr("action");
        jQuery.ajax({
          url: url,
          data: data,
          method: form.attr("method"),
          contentType: form.attr("enctype") || "application/x-www-form-urlencoded",
          success: function (data) { form.trigger('success', data); },
          error: function (data) { form.trigger('error', data); }
        });
      }

      return false;
    });

    return form;
  };

  exports.getForm = function (form) {
    var data = {};

    var inputs = $(form).children("input");
    _.each(inputs, function (input) {
      input = jQuery(input);
      if (input.attr("type") === "submit") { return; }
      data[input.attr("name")] = input.val();
    });;

    return data;
  };

  exports.template = function (t) {
    var tmpl = t.toString()
      .replace(/^[^\/]+\/\**/, '')
      .replace(/\*\/[^\/]+$/, '');
    return function (d) {
      d = d || {};
      return _.template(tmpl, d, {
        interpolate : /\{\{(.+?)\}\}/g
      });
    };
  };

  return exports;
}());
