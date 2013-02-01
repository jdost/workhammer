# Workhammer frontend

So you want to work on the frontend for workhammer?  Here is a simple guide to how
to fit into the Javascript framework.

## Loading your file

The js files are all set to load in the `rpg/templates/index.html` file.  Just place
your file below the other <script> tags like:
``` django
   <script type="text/javascript" src="{{ static('js/myextension.js') }}"></script>
```
Where `myextension.js` is your js file.  The `static` function in the templates is
useful for changing the static file location.  On development, the python app will
serve the local files, but deployed, the files can live on any server (like AWS) and
this function will then deliver that URL instead.

## Adding to the application

Probably the first thing you will want to do for your application is adding an entry
to the menu, this is the window that pops up whenever you hit <Esc>.  This is the
overall system to getting to different areas of the application (if you want to
modify an existing window, you will need to edit the existing file).  To add a
listing to the menu:
``` javascript
   window.menu.add("View new stuff", {
      "exec": function () {
         showNewStuff();
         return false;
      },
      "show": function () {
         return true;
      }
   });
```
So that is a lot of stuff.  The command to add to the menu (object lives at 
`window.menu`) is the `add` method.  This takes two arguments, the first is the 
label of the new entry, in the example it is "View new stuff".  The second argument
describes the entry in the menu.  The two properties the object can have (if not
defined, they are defaulted to generic versions) are "exec", which describes what to
do when the entry is selected, and "show", which describes whether to show the entry
whenever the menu is pulled up.  This is used with things that show up conditionally
based on state, like whether the user is logged in or whether or not they have an
attached player.  The "show" function will return a boolean, the "exec" function
can also return a boolean, if it is a truthy value (i.e. 1, true, etc.), the menu 
will not be closed.

## Building your window

To help standardize the look, you can create your window with the 
`window.lib.window` function.  This generated window div has some helper stuff
attached to it (a lot is described in other sections).  The function call takes
one argument, a string, which it will set as the class for the div created.  The
returned div is a jQuery wrapped DOM node, so you can do all of the fun things that
jQuery allows on a DOM node.  When you are ready to add it to the DOM, you can
call the `render` method on it.  This will insert it into the DOM with a wrapping
container that handles centering the window in the viewport (please use this as it
will allow the window to work with any UI changes that may be done).

## Working with the user input

By default, the frontend framework will take care of a number of the overarching UI
behaviors.  One is the arrow key based navigation of menus.  To work with this, it
is required that you use inputs and anchors for selectable sections.  This is
because these are the items that can take focus, allowing for the keyboard to handle
working with them.  All of the anchors must also have a defined `href` attribute,
for now I have been using `javascript:;` but I may replace this with actual state
URLs and utilize the History API.
``` html
   <div>Show Leaders</div> <!-- I will not take :focus -->
   <a>Show Quests</a> <!-- I won't take focus either -->
   <a href="javascript:;">Show Classes</a> <!-- I will take focus -->
```

## Forms

The window also comes with built in form handlers.  If a form is submitted, it will
try to take care of the data collection and handling the AJAX request.  To work with
the system in place, the inputs for the form should have the key you want to give
the backend as the name of the input.  If the name begins with a '.' it is ignored
(this is useful for validation based things like confirming the password for reg).
If you want to validate the form before sending it, you can attach a `submit`
listener on the form element and stop the propagation of the event if it fails.
To define how the data is being sent, you define the `action` attribute of the 
<form> element.  If this is of the form `javascript:<rpg.class.action>;`, the public
function `window.rpg.class.action` will be called with the key-value object as its
first argument and an object describing 'error' and 'success' callbacks.  If it is
a URL, the object will be passed into a `jQuery.ajax` call.  Now a quick example:
``` html
   <form action="javascript:rpg.user.login;">
      <input type="text" name="username">
      <input type="password" name="password">
      <input type="submit" value="Login"> <!-- having a submit allows <Enter> to work -->
   </form>
```
Note: having the `submit` input in the form enables the hit enter to submit behavior.
This will (on submission) send the { "username", "password" } object to the 
`rpg.user.login` function (no more code needed).  In order to handle the outcome of
that submission call, you will listen to the 'success' and 'error' events on the
<form> element.  These both are given an additional argument that is the result of
either outcome:
``` javascript
   loginWindow.bind('success', function (evt, userData) {
      // Login successful
   }).bind('error', function (evt, errorMessage) {
      loginWindow.find(".message").text("Login failed: " + errorMessage);
   });
```

## Styling

For development, all of the styles use LESS (deployed, they all are compiled down
to CSS).  LESS doesn't require any watcher or compiler before you view it in your
browser, there is a JS file that is loaded in the index that will compile the LESS
code in the window whenever you refresh.  To include your stylesheet in the document
just add a line like:
``` django
   {{ style('myextension') }}
```
This will generate the appropriate <link> tag for either the less based one or, when
deployed, the static CSS URL.  In your LESS stylesheet, you can include the 
colorscheme file with:
``` less
@import ".colors.less";
```
This adds a number of variables that define universal colors, there is @fg which is
the default foreground color and @bg which is the default background color.  Check
out the other included colors (or add your own).  You can then use the LESS 
functions to modify these base colors with stuff like lighten and darken.
