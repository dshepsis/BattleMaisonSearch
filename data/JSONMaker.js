function printResult (p_text) {
  var resEle = document.createElement("PRE");
  var textNode = document.createTextNode(p_text);
  resEle.appendChild(textNode);
  resEle.id = "output";
  resEle.addEventListener( "click", function(){copyToClipBoard(resEle);} );
  document.querySelector("body").appendChild(resEle);
  return resEle;
}

/* Making stuff case-insensitive: */
trainerData = trainerData.toLowerCase();
pokemonData = pokemonData.toLowerCase();

var trainerObj = {};
var trainerSetRegex = /^([^\n\r,]+?) +- +(.+)$/gmi;
var trainerSetResult = trainerSetRegex.exec(trainerData);
while (trainerSetResult !== null) {
  trainerName = trainerSetResult[1];
  trainerTeam = trainerSetResult[2];
  /* Special cases for trainers using multiple teams, such as Nita: */
  if (trainerObj[trainerName] !== undefined) {
    /* Parse through new team to see if the old team contains each poke */
    let pokeRegex = /([^, ][^,]+)([1-4])/g;
    for (let pokeMatch = pokeRegex.exec(trainerTeam); pokeMatch !== null;
        pokeMatch = pokeRegex.exec(trainerTeam)) {
      if (trainerObj[trainerName].indexOf(pokeMatch[0]) === -1) {
        trainerObj[trainerName] += ", " + pokeMatch[0];
      }
    }
  } else {
    trainerObj[trainerName] = trainerTeam;
  }
  /* Sorting the team for the sake of consistency: */
  trainerObj[trainerName] = trainerObj[trainerName]
    .split(", ")
    .sort()
    .reduce((runningTotal, newPart) => runningTotal + ", " + newPart);
  trainerSetResult = trainerSetRegex.exec(trainerData);
}

trainerObjArray = Object.entries(trainerObj);

var teamToNumberWFreq = {};
var uniqueTeams = 0;
for (let i = 0; i < trainerObjArray.length; ++i){
  let teamString =  trainerObjArray[i][1]

  if (!teamToNumberWFreq[teamString]) {
    teamToNumberWFreq[teamString] = {Name:uniqueTeams, Frequency:1};
    ++uniqueTeams;
  } else {
    ++teamToNumberWFreq[teamString].Frequency;
  }
}

var trainerToTeamName = {};
for (let i = 0; i < trainerObjArray.length; ++i) {
  trainerToTeamName[trainerObjArray[i][0]] = teamToNumberWFreq[trainerObjArray[i][1]].Name;
}

/* Now we have to add the ORAS trainer names.
 * Originally, this was done using a text file to map ORAS trainers to their
 * XY counterparts (since all "new" trainers were just renames of old ones).
 * However, to do that in JSON would be mapping Strings to Strings. It actually
 * takes LESS memory and time to just have the ORAS trainers in this map
 * since it's just String to Number. */
let tNameEntries = Object.entries(trainerNameTranslation);
for (let i = 0; i < tNameEntries.length; ++i) {
  let ORASName = tNameEntries[i][0];
  let XYName = tNameEntries[i][1];
  if (trainerToTeamName[ORASName] !== undefined) {
    console.log("Found trainer in ORAS and XY: " + ORASName + ", " + XYName);
  }
  else {
    if (trainerToTeamName[XYName] === undefined) {
      console.log("Missing XY Trainer: " + XYName);
    }
    trainerToTeamName[ORASName] = trainerToTeamName[XYName];
  }
}

printResult(JSON.stringify(trainerToTeamName));


/* Now we go through the process of making the array which holds each team
 * object. Each object will map a pokemon in that set to an array of 4 booleans.
 * Each boolean corresponds to whether the team contains that set for that
 * pokemon. So if teamsInOrder[0]["Yanmega"][0] === true, then team 0 contains
 * the 1 set for Yanmega, and trainers using that set may randomly have
 * Yanmega1 on their team.
 * NOTE: The index used is 0, but it corresponds to team
 * team 1. This is because arrays in JS are 0-based, whereas the set labels are
 * 1 to 4. */
var teamsInOrder = [];

function teamStrToObj (teamStr) {
  /* Pokemon names can't start with a space or contain a comma: */
  let pokeRegex = /([^, ][^,]+)([1-4])/g;
  let pokeObj = {};
  for (let pokeMatch = pokeRegex.exec(teamStr); pokeMatch !== null;
      pokeMatch = pokeRegex.exec(teamStr)) {
    let setsArr = [];
    /* If I haven't recorded this Pokemon yet, add it to the team: */
    if (pokeObj[pokeMatch[1]] === undefined) {
      /* Add this set number to the array for this pokemon */
      setsArr.push( Number(pokeMatch[2]) );
      pokeObj[pokeMatch[1]] = setsArr;
    }
    /* At this point, we know we have seen this pokemon before, but have now
     * found a new set for it, so add this new set: */
    else {
      let knownSets = pokeObj[pokeMatch[1]];
      /* If we already knew about this set, something has gone wrong: */
      if ( knownSets.includes(Number(pokeMatch[2])) ) {
        console.error("I found the set " + pokeMatch[1] + pokeMatch[2] + " twice!");
      }
      /* Add the new set number to the array: */
      pokeObj[ pokeMatch[1] ].push( Number(pokeMatch[2]) );
    }
  } /* Close for loop */
  return pokeObj;
}

for (let team in teamToNumberWFreq) {
    if (!teamToNumberWFreq.hasOwnProperty(team)) {
        continue;
    }
    teamsInOrder[teamToNumberWFreq[team].Name] = teamStrToObj(team);
}
printResult(JSON.stringify(teamsInOrder));


/* Next goal is to create the object which stores data for each pokemon. Namely,
 * there should be moveset information for every single set, all stored in an
 * object. */

/* Splitting pokemonData into something parseable */
let pokeDataLines = pokemonData.split(/[\r\n]/);
let splitPokeData = [];
/* When unexpected breaks appear in the text file, I assume that the list is
 * separated into different groups for some reason, e.g. separating Normal
 * Battle Maison sets from Super Battle Maison ones. Since each group starts the
 * numbering back at 0, tracking groups allows us to distinguish sets with the
 * same ID number. This variable stores the indices when each new group starts:
 */
let groupIndices = [0];
/* Skip initial lines which don't look like data: */
let i = 0;
while ( !pokeDataLines[i].match(/^\d+ \| [A-Za-z]+/) ) {
  ++i;
}
/* Loop through remaining lines: */
for (let lookingForNewGroup = true; i < pokeDataLines.length; ++i) {
  /* If it looks like pokemon data: */
  if ( pokeDataLines[i].match(/^\d+ \| [A-Za-z]+/) ) {
    lookingForNewGroup = true;
    splitPokeData.push( pokeDataLines[i].split(" | ") );
  }
  /* Found a group break: */
  else {
    if (lookingForNewGroup === true) {
      groupIndices.push(splitPokeData.length);
    }
    lookingForNewGroup = false;
  }
}

/* Declaring index names for less confusing code: */
const idNumber = 0;
const pokemonName = 1;
const nature = 2;
const item = 3;
const moves = [4,5,6,7];
const evSpread = 8;

/* Helper functions: */
function howManyGroupsAhead (index) {
  let groupsAhead = -1;
  for (let i = 0; i < groupIndices.length; ++i) {
    if (index >= groupIndices[i]){
      ++groupsAhead;
    }
    else break;
  }
  return groupsAhead;
}
function removeLastChar(str, num) {
  /* Makes num optional, defaulting to 1: */
  if (num === undefined) num = 1;
  return str.substring(0, str.length-num);
}
/**
 * Returns an array of values from values, picked using the indices from the
 * indices parameter. Values are picked in the order they are supplied.
 *
 * Take the following example:
 *                  0      1      2       3       4
 * > getIndices(["Hello", "I", "world", "you", "love"], [0,2]);
 * ["Hello", "world"].
 *
 * Note that indices doesn't have to be in-order. The returned array will be
 * in the order specified by the indices parameter. For example:
 *
 * > getIndices(["Hello", "I", "world", "you", "love"], [1, 4, 3]);
 * ["I", "love", "you"]
 *
 * Repetition is also allowed:
 *
 * > getIndices(["Hello", "I", "world", "you", "love"], [0,0,1,4,4,3]);
 * ["Hello", "Hello", "I", "love", "love", "you"]
 *
 * @param {Array} values - The array of values from which certain values are
 *   picked.
 * @param {Array<number>} indices - An array of indices which are picked. May be
 *   in any order.
 * @returns {Array} - An array of values corresponding to the given indices, in
 *   the given order.
 */
function getIndices (values, indices) {
  if (!Array.isArray(values)) {
    throw new TypeError("First parameter must be an array!");
  }
  if (!Array.isArray(indices)) {
    throw new TypeError("Indices must be in an array!");
  }

  var result = [];
  var length = indices.length;
  for (var i = 0; i < length; ++i) {
    result[i] = values[ indices[i] ];
  }
  return result;
}
/* Helper functions over. Moving on to actual stuff: */

let pokeDataObj = {};
for (let i = 0; i < splitPokeData.length; ++i) {
  let pokeInfo = splitPokeData[i];
  /* The set object we will be adding to pokeDataObj: */
  let pokeSet = {
    ID: Number(pokeInfo[idNumber]),
    /* Which group of ID's this set belongs to: */
    Group: howManyGroupsAhead(i),
    Nature: pokeInfo[nature],
    Item: pokeInfo[item],
    Moves: getIndices(pokeInfo, moves),
    EVs: pokeInfo[evSpread]
  }
  let pokeName = pokeInfo[pokemonName];
  let pokeSpecies = removeLastChar( pokeName );
  let setNumber = Number(pokeName.charAt(pokeName.length - 1));
  /* If this is the first set for this pokemon: */
  if (!pokeDataObj[pokeSpecies]) {
    let setArr = [];
    setArr[setNumber - 1] = pokeSet;
    pokeDataObj[pokeSpecies] = setArr;
  }
  else {
    if (pokeDataObj[pokeSpecies][setNumber - 1]) {
      throw "Duplicate set detected for: " + pokeName + ".";
    }
    pokeDataObj[pokeSpecies][setNumber - 1] = pokeSet;
  }
}
printResult(JSON.stringify(pokeDataObj));
