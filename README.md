# Battle Maison Search Engine

A Search Engine for Battle Maison Trainers and Pokemon in XY and ORAS

## Link

You can view the full page <a href="https://dshepsis.github.io/BattleMaisonSearch/">here</a>.

## How the Battle Maison Works

Each trainer uses a single "team" of anywhere from 4 to 99 different species of Pokemon. Whenever you battle such a trainer, an appropriate number of said Pokemon (3 for singles, 4, for doubles, 6 for triples, 4 for rotation, and 2 for multi) are randomly chosen from their team and used in the battle.

Which team a trainer uses is solely correlated to their name. Mara will always choose from the same team of Pokemon, regardless of format. As will Jai, as will Marie-Noelle, etc.

Each team may be used by multiple trainers, though some are exclusive to single trainers, such as the teams used by the Battle Chatelaines.

Pokemon used by NPC trainers within the Maison may have one of 2 or 4 sets, depending on the Pokemon. These sets differ by the Pokemon's Nature, Held Item, Moves, and EV spread. The ability is randomly chosen from any of the Pokemon's normal or hidden abilities, regardless of the set, and regardless of whether that ability can be legally obtained in-game.

Each team lists not only which Pokemon it contains, but also which of the 4 (or 2) sets of that Pokemon may be selected from that team. For example, many teams allow only Set 1 for any of its Pokemon. Other teams allow Sets 1-4 for all Pokemon. Yet other teams allow different set numbers for different Pokemon. And other teams still follow different patterns.

Because a Pokemon's set is highly informative in determining a strategy in any battle within the Maison (and in general), knowing which sets your NPC opponent has available to them can be a big advantage. This is especially true when you're going for long streaks, or using strategies that can be hard-countered by certain moves or items.

This tool exists to make that information easily accessible to anyone with a computer/phone and an internet connection.

## How to use

When you start a battle in the Battle Maison, immediately note down the opposing trainer's name. Their title/occupation isn't important, but you must remember the name, as you cannot check their name from within the battle interface, unless they choose an action (such as sending out a new Pokemon or switching) which reveals their name in the dialogue.

Type their name into the "Trainer Name" field of the tool's interface. What you type isn't case-sensitive (capitals don't matter) but the spelling must be correct. If a trainer name contains a symbol (such as "Marie-Noelle"), that symbol must be typed in. As you type, the interface will **not** change until you've typed something into the "Pokemon" field.

If you type an asterisk "\*" (without the quotation marks) as the trainer name, it will act as a wildcard and you will get information for every set (all 4 or 2) of the given Pokemon.

Then, type the name of your opponent's Pokemon. Again, this is not case-sensitive, but the spelling must be correct. As you type, you'll be given an error message, which will tell you whether your trainer name or Pokemon name is incorrect.

Once you finish typing, a list of results will appear, detailing every set of the given Pokemon that the given trainer may use. You can click on a row to highlight that set, useful for witling down the possibilities for which set the Pokemon actually is, as they use moves or reveal their item.

## How this tool works (Technical Explanation)

The script starts by getting the necessary data files (found in the data folder) via XML HTTP Request (or XHR for short). This is done solely so that the data can be separated from the rest of the script.

The data files are 3 separate JSON files, which each represent different data.

 * trainerToTeam.json: An object which maps a trainer name to the number of the team used by that trainer. The number for each team is arbitrary, but is between 0 and 73 inclusive. Here's an excerpt:
 ```json
 {
     "delaney":39,
     "masaharu":0,
     "charlotte":73,
     "jamille":72,
     "angus":41,
 }
```

 * teamContents.json: An array which maps the team number to an object for the corresponding team. Each team object contains a key for every Pokemon species which that team contains a set for, mapping to an array of the set numbers (between 1 and 4 inclusive) for each Pokemon. Here's an example of one such team object, this one for team 45:
 ```json
 {
    "aurorus": [2],
    "carbink": [2],
    "claydol": [2],
    "cradily": [3],
    "dugtrio": [1,2,3,4],
    "excadrill": [1,2,3,4],
    "ferrothorn": [1],
    "garchomp": [1,2,3,4],
    "gastrodon": [3],
    "gigalith": [2,3],
    "gliscor": [1,2,3,4],
    "hippowdon": [1,2,3,4],
    "shuckle": [4],
    "tyranitar": [1,2,3,4],
    "tyrantrum": [2]
  }
```

* pokemonSets.json: An object which maps Pokemon species names to an array of 4 or 2 objects, one for each valid set of that Pokemon. Each object details all of the information about that set. This is the same information presented to the user when they make a search query. Here's an example:
```json
"omanyte": [
  {
    "Species": "Omanyte",
    "Set": 1,
    "ID": 52,
    "Group": 1,
    "Nature": "bold",
    "Item": "shell bell",
    "Moves": ["brine", "ancientpower", "protect", "shell smash"],
    "EVs": "def/spd"
  },
  {
    "Species": "Omanyte",
    "Set": 2,
    "ID": 118,
    "Group": 1,
    "Nature": "modest",
    "Item": "rindo berry",
    "Moves": ["ice beam", "rock blast", "mud shot", "surf"],
    "EVs": "def/spa"
  }
],
```
Note that the "ID" and "Group" fields are metadata, and are not relevant to gameplay. Thus, they are not presented to the user. The

The searching function is run any time the values in either user-input field are changed. This means that with every character the user types or deletes text from the Pokemon or Trainer name fields, a search is run (unless either input field as completely empty).

When a search is run, the user's inputs are lowercased, trimmed (leading and trailing whitespace is removed) and saved. The entered trainer name is used to query to trainer-to-team map, yielding the team number.

The team number is then used to query the team-contents array, to yield a team object as described above. That team object is then queried with the entered Pokemon name to yield an array of set numbers for that Pokemon which are used by the given trainer.

Note that the array of set numbers is 1-based. That is, teams are numbered 1 through 4, as opposed to 0 through 3 (0-based). Since JavaScript is 0-based, we must do a translation by a factor of -1 for the next step.

We then query the Pokemon-sets object with the entered Pokemon name to yield an array of objects containing set information for each of that Pokemon's sets (again, 2 or 4). We then iterate over the list of sets used by our trainer (acquired in the previous step) and add only the corresponding set objects to a new array.

Once this is done, said new array will contain only the data for sets that the given trainer actually uses. That array is then parsed out into a table, which is presented to the user.

For more information, read the un-minified JavaScript files in the js folder.
