# Classes

Classes are specializations the player builds up.  The player can then focus on one
class or spread the work across multiple classes.  Classes are all controlled
passively, meaning they do not select any class but are opted into all classes that
exist (and you have some XP in).

## Experience

Quests that level up a skill will give designated amounts of the XP for the skill.
So a frontend developer class would have a reward of 10 XP for the JS coding skill, 
so when the skill levels up the 10 XP reward is then given to the frontend developer
class.  The reward for a skill is set on a per skill-class basis.  So the same JS
coding skill could only give 5 XP to the overall developer class.

## Leveling

When a class levels up, it will add the level increase (it could be possible to jump
more than one level at a time) to the player's overall level, meaning the player
level is a summation of all of the classes a player has leveled.  So the player
`Megatron` is a level 3 frontend developer, a level 2 tester, and a level 10
decepticon, making him level 15 (`2+3+10 = 15`).

## Leaders

There is a leaders URL provided in the full Class response packet.  Calling this
as is (meaning you just use the URL with a GET) will return (up to) the top 10
leaders in this class (if no one has leveled the class, it will return an empty
array).  If you set the GET param of `limit` to something else, it will override the
default of `10`.

## Data Structure

Like skills, classes are only listed for a player when there is **some** experience
in it (meaning an associated skill has been leveled up).  This is done because it
would cause a lot of clutter whenever a class was created to add a default structure
to every existing player.  The structure for a class is created on demand instead.
