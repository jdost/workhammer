(function (exports) {
  var entries = {},
    win,
    lib = window.lib;

  var templates = {
  };

  exports.add = function (label, obj) {
    entries[label] = _.defaults(obj, baseEntry);
    return exports;
  };
  exports.remove = function (label) { delete(entries[label]); };

  exports.show = function () {
    if (win) { return; }

    win = lib.window("menu");
    _.each(entries, function (obj, label) {
      if (!obj.show()) { return; }
      lib.el("a")
        .attr("href", "javascript:;")
        .bind("click", function (evt) {
          if (!obj.exec()) { exports.close(); }
        }).text(label)
        .appendTo(win);
    });

    win.render(true);
  };

  exports.close = function () {
    if (!win) { return; }

    win.remove();
    win = false;
  };

  exports.toggle = function () {
    exports[win ? "close" : "show"]();
  };

  var baseEntry = {
    "exec": function () { return true; },
    "show": function () { return true; }
  };
}(window.menu = {}));
