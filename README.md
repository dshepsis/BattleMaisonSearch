# Battle Maison Search Engine

A Search Engine for Battle Maison Trainers and Pokemon in XY and ORAS

















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
