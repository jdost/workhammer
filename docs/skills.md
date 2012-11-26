# Skills

Skills are a category of attributes to a player.  They are awarded SP (skill points)
through [Quests](quests.md) and will level up.  Levelling up of skills will advance
the main class of the player.

## Attribute

Skills are inherently given to a player.  The system will only add a skill to a
player when they have any points in the skill (so empty skills will not be shown).
Skills will have properties for the leveling formula (ex. the skill levels at 100
SP for each level, so 100, 200, 300, etc, the formula is 100*n, for 100, 210, 320 or
the cap increments by 10 each time, starting at 100, the formula would be: 90*n +
10*n^2).  The skills would also have a property dictating the amount of XP to add to
the total experience pool.  There should be defaults set in the settings file, so
that skills can be quickly created using the default bonus/formula.

## Types

Skills can be any category of action that is able to be improved via a quest.  An
example would be `testing` that gets 5 SP when the player completes a `Test Writing`
quest.

## Leveling

The original document described skills as 'jobs' but I have changed the name to
skills to reflect their automatic nature (jobs are something someone elects to do).
But the original leveling was that for every 100 points in the type of skill would
level it up, granting 15 XP to the Player (main class?).  This will probably be
configurable for each Skill (so levelling up testing could give 20 XP versus
levelling up burns could only give 5 XP -- this would allow for joke skills that
don't actually affect the actual player beyond being there, like 'build breaking').
