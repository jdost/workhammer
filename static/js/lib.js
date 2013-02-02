(function (exports) {
  /** lib.el
    Helper function, creates a DOM node and wraps with with jQuery for easy
    manipulation
   **/
  exports.el = function (type) { return jQuery(document.createElement(type)); };
  /** lib.window
    Window creator, used for working into UI system.  Returns a "window" DOM node,
    with a `render` method which will incorporate the node into the window system.
    Takes optional argument on additional classes to add to the created window set.

    NOTE: will bind form submission to do the handling already, requires that the
    form's action be either a target URL and will call an AJAX request to the URL
    or a `javascript:[global function name];` and it will parse and find the
    specified function and exec that with the dataset from the form as its argument,
    and with a second argument of callbacks.  The form gets 'success' and 'error'
    events triggered on either result from the AJAX.
   **/
  exports.window = function (classes) {
    var win = exports.el("div")
      .addClass("window")
      .addClass(classes)
      .on("submit", function (evt) {
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
            data: form.attr("enctype") === "application/json" ?
                JSON.stringify(data) : data,
            method: form.attr("method"),
            contentType: form.attr("enctype") || "application/x-www-form-urlencoded",
            success: function (data) { form.trigger('success', data); },
            error: function (data) { form.trigger('error', data); }
          });
        }

        return false;
      });

    var container = exports.el("div")
        .addClass("container");
    win.render = function (uncontained) {
      container.append(win);
      $(document.body).append(uncontained ? win : container);
      win.find(":input, a").first().focus();
      return win;
    };
    win.close = function () {
      container.remove();
    };

    return win;
  };
  /** lib.getForm
    Helper function that takes a form and generates a hash table with the `name` -
    `value` pairs of the form's inputs.  Ignores all submit inputs and any names
    that begin with a `.`
   **/
  exports.getForm = function (form) {
    var data = {};

    var inputs = $(form).children(":input");
    _.each(inputs, function (input) {
      input = jQuery(input);
      if (input.attr("type") === "submit") { return; }
      if (input.attr("name")[0] === ".") { return; }
      data[input.attr("name")] = input.val();
    });;

    return data;
  };
  /** lib.template
    Converts an argument into an underscore template function.  The argument can
    be a template string, an array of strings (that will get turned into a single
    string), or a function of the form:
      function () {/*
        !!Multiline Template String!!
      * /}
      NOTE: there shouldn't be a space between the asterisk and slash at the end,
        had to add it because it closed this comment
    This is because Javascript doesn't have a sane version of multiline strings, so
    this is a current compromise.

    The return template function will take a hash table argument and use it as the
    base for the template creation, output is the HTML.
   **/
  exports.template = function (t) {
    var tmpl = "";

    if (_.isFunction(t)) {
      tmpl = t.toString()
        .replace(/^[^\/]+\/\**/, '')
        .replace(/\*\/[^\/]+$/, '');
    } else if (_.isString(t)) {
      tmpl = t;
    } else if (_.isArray(t)) {
      tmpl = t.join("");
    }

    return function (d) {
      d = d || {};
      return _.template(tmpl, d, {
        interpolate : /\{\{(.+?)\}\}/g
      });
    };
  };
}(window.lib = {}));
