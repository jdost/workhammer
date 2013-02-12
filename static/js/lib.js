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
        var data = exports.getForm(evt.target),
          form = $(evt.target);

        // Don't do anything if no action is defined
        if (!form.attr("action")) { return false; }

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

        evt.stopPropagation();
        evt.preventDefault();
        return false;
      });

    win.focus = function () {
      win.find(":input, a").first().focus();
      return win;
    };
    win.close = function () {
      container.remove();
    };
    win.center = function () {
      win.css('margin-top', '-' + (win.outerHeight(true)/2).toString() + 'px');
      return win;
    };

    var container = exports.el("div")
        .addClass("container");
    win.render = function (uncontained) {
      container.append(win);
      $(document.body).append(uncontained ? win : container);
      return win.center().focus();
    };

    return win;
  };
  /** lib.getForm
    Helper function that takes a form and generates a hash table with the `name` -
    `value` pairs of the form's inputs.  Ignores all submit inputs and any names
    that begin with a `.` or have no name.  If names have `.` in them, treats them
    as a hierarchical representation and will create the proper object structure
    above them.  So `foo.bar.baz` will make {'foo': {'bar': {'baz': <value>}}}.
   **/
  exports.getForm = function (form) {
    var data = {};

    var inputs = $(form).children(":input");
    _.each(inputs, function (input) {
      input = jQuery(input);
      if (input.attr("type") === "submit") { return; }
      if (!input.attr("name")) { return; }
      if (input.attr("name")[0] === ".") { return; }
      var field = data, keys = input.attr("name").split("."), key;
      for (var i = 0, l = keys.length; i < l; i++) {
        if (key) {
          field[key] = {};
          field = field[key];
        }
        key = keys[i];
      }
      field[key] = input.val();
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
  /** lib.progressBar
    Creates a progress bar using the provided arguments.  The progress bar will be
    an element set that will show a bar with a progress fill that fills the
    percentage of the determined progress.  The arguments can either be:
      - a single argument, either a floating percentage ( < 1 ) or an integer
        percentage ( > 0 && < 100)
      - three integers, the first being the current value, second being the base,
        third being the target value, so: [second] < [first] < [third]
   **/
  var progressTemplate = exports.template(function () {/*
    <progress value={{ perc/100 }}></progress>
    */});
  exports.progressBar = function (perc, base, tgt) {
    if (base && tgt) {
      tgt -= base;
      perc = (perc - base)/tgt;
    }
    if (perc > 1) {
      perc = perc/100;
    }

    return progressTemplate({ "perc": perc });
  };
}(window.lib = {}));
