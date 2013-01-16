# Classes

Classes are specializations the player builds up.  The player can then focus on one
class or spread the work across multiple classes.  Classes are all controlled
passively, meaning they do not select any class but are opted into all classes that
exist (and you have some XP in).

## Leveling

Quests that level up a skill will give weighted amounts of the XP bonus the skill
grants to each class.  So a frontend developer class would have a weight of 1 for
the JS coding skill, so when the skill levels up and grants its 15 XP bonus, it will
give that full bonus to the frontend developer class.  But the unit testing skill
only has a weight of 0.5 for the frontend developer class, so it's 20 XP bonus only
grants 10 XP to the class (0.5*20).
