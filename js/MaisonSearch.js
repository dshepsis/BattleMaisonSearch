"use strict";

/*
 * INITIALIZATION:
 */

/* Getting the form elements so that they can be quickly queried for their
* contents: */
var htmlLoaded = false;
function saveInterfaceElements () {
  if (htmlLoaded) {
    console.log("Loading tried twice!");
    return;
  }
  window.trainerForm = document.getElementById("trainer");
  window.pokemonForm = document.getElementById("pokemon");
  window.resultsTable = document.getElementById("output");
  htmlLoaded = true;

  /* Add search as an event handler to our two input elements" */
  trainerForm.oninput = trainerForm.onpropertychange = search;
  pokemonForm.oninput = pokemonForm.onpropertychange = search;


  if (window.resourcesLoaded !== undefined && resourcesLoaded > 3) {
    console.error("More than 3 resources loaded. WTF?");
  }

  /* If the resources are still loading: */
  if (window.resourcesLoaded === undefined || resourcesLoaded < 3) {
    return;
  }
  /* Otherwise, the resources must have finished loading before the HTML
  * (Unlikely, but possible), so search() immediately: */
  else search();
}
window.onload = document.onload = saveInterfaceElements;

/*
 * MAIN SEARCH FUNCTIONS:
 */

/**
 * Validates the user inputs from the form and calls pkSearch() to find the
 * relevant information. Then, adds to result to the interface with DOM
 * commands:
 */
function search () {
  /* If the HTML or resources haven't completely loaded, immediately exit: */
  if (!htmlLoaded || window.resourcesLoaded === undefined || resourcesLoaded < 3) {
    return;
  }

  var trainerName = trainerForm.value.toLowerCase().trim();
  if (trainerName === "") {
    resultsTable.style.display = "none";
    return;
  }
  /* Special case for the trainer O'Hare. I do this because the apostrophe in
   * his name is weird and I suspect some people might try to use other
   * symbols like the grave mark `. This just catches all conceivable
   * variations (e.g. "O`hare", "O-hare", "ohare", "o hare", etc.): */
  if (/o\W*hare/.test(trainerName)) {
    trainerName = "o'hare";
  }

  var pokemonName = pokemonForm.value.toLowerCase().trim();
  if (pokemonName === "") {
    resultsTable.style.display = "none";
    return;
  }
  /* At this point we've determined we have enough data to run a search,
   * which will get us either an error or a valid result.
   * Either way, the table needs to be made visible now so that the results
   * can be displayed later: */
  resultsTable.style.display = "table";

  /* Get relevant data: */
  var results = pkSearch(trainerName, pokemonName);

  /* Then display the results: */
  /* First, clear out the table: */
  while (resultsTable.firstChild) {
    resultsTable.removeChild(resultsTable.firstChild);
  }

  /* Use document fragment to avoid multiple changes to the DOM: */
  var docFrag = document.createDocumentFragment();

  /* If we got an error response, display it: */
  if (results.Error) {
    /* Set an error class so that error messages can be styled differently: */
    resultsTable.className = "search-error";

    var header = makeTableRow("Error!", "th");
    docFrag.appendChild(header);

    var body = makeTableRow(results.Message);
    docFrag.appendChild(body);
  }
  /* If we did not get an error, display the response normally: */
  else {
    /* If we found a result, override any other classes on the element: */
    resultsTable.className = "search-results";

    /* Create header: */
    var headerItems = ["Species", "Set", "Nature", "Item", "Moves", "EVs"];
    var colSpans =    [1,          1,     1,        1,      4,       1];

    var header = makeTableRow(headerItems, "th");
    var numFields = headerItems.length
    /* For fields meant to be wider than 1 column, set their colspan attribute: */
    for (var col = 0; col < numFields; ++col) {
      header.children[col].colSpan = colSpans[col];
    }
    docFrag.appendChild(header);

    /* Create body: */
    /* Add a row for each result: */
    var resLength = results.length;
    for (var row = 0; row < resLength; ++row) {
      var bodyRow = makeElement("tr");
      var thisResult = results[row];

      /* Add a column for each field of a result: */
      for (var col = 0; col < numFields; ++col) {
        var field = thisResult[ headerItems[col] ];

        /* Special handling for array fields: */
        if (Array.isArray(field)) {
          var len = field.length;
          /* If the length of the field is wrong, give an error in console: */
          if (len !== colSpans[col]) {
            console.error("Unexpected Field Length at row " + row + ", column " + col + ".");
          }

          /* Otherwise, add in the sub-fields to the table: */
          for (var i = 0; i < len; ++i) {
            bodyRow.appendChild( makeElement("td", field[i]) );
          }
        }

        /* Handling for normal, single-datum fields: */
        else {
          bodyRow.appendChild( makeElement("td", field) );
        }
      } //Close column-making for-loop
      /* The row for this result is now complete. Give it a click event handler
       * so that the user can click on a row to highlight it, and add it to the
       * fragment element: */
      bodyRow.onclick = clickToHighlight;
      bodyRow.onmousedown = preventClickToHighlight;
      docFrag.appendChild(bodyRow);
    }
  }
  /* Add the result to the table so the user can see it: */
  resultsTable.appendChild(docFrag);
}


/**
 * Main searching function. Takes in a trainer and pokemon name, and returns
 * the information about the sets of said pokemon which said trainer uses.
 * For example, trainer Mara uses two sets for Conkeldurr: set 2 and set 4.
 * So,
 *   pksearch("mara", "conkeldurr")
 * Will yield results for sets 2 and 4 of Conkeldurr, as listed in the
 * pokemonSets.json file.
 *
 * NOTE: Both parameters must be lowercosed, and must contain the proper symbols.
 * For example, the trainer Marie-Noelle must be passed as "marie-noelle", NOT
 * "Marie-noelle" or "marie noelle" or "marienoelle" etc. Porygon-Z must be
 * passed as "porygon-z", NOT "porygon-Z" or "porygonz" or "porygon_z".
 */
function pkSearch (trainerName, pkmnName) {
  /* SPECIAL CASE: Wildcard trainer: */
  if (trainerName === '*') {
    var allSets = pokemonSets[pkmnName];
    /* If the name isn't valid: */
    if (allSets === undefined) {
      return {
        Error: true,
        ErrorType: "badPokemon",
        Message: ("There is no Pokemon called " + pkmnName + " in the Battle Maison.")
      }
    }
    /* Otherwise, return every set for the pokemon: */
    return allSets;
  }
  /* Find the number of the team used by the parameter trainer */
  var teamNumber = trainerToTeam[trainerName];
  /* Bad Trainer error: */
  if (teamNumber === undefined) {
    return {
      Error: true,
      ErrorType: "badTrainer",
      Message: ("Trainer " + trainerName + " does not exist.")
    };
  }

  /* If the team found is outside of the valid range of teams, throw an error:
   * NOTE: I don't actually expect this to ever fire. If it does, that means
   *   the data files have an error. */
  if (!Number.isInteger(teamNumber) || teamNumber < 0
      || teamNumber >= teamContents.length) {
    console.error(teamNumber + " is not a valid team number!");
  }

  /* Then check the sets for the parameter pokemon which are used by the team
   * used by the parameter trainer.
   * NOTE: While many trainers only use 1 set for any given pokemon, others
   * can use multiple, sometimes all 4: */
  var setsForPokemon = teamContents[teamNumber][pkmnName];
  /* Bad Pokemon error: */
  if (setsForPokemon === undefined) {
    return {
      Error: true,
      ErrorType: "badPokemon",
      Message: ("Trainer " + trainerName + " does not use the Pokemon " + pkmnName + ".")
    };
  }
  /* Will contain the data about each pokemon which I found: */
  var setData = [];
  /* Storing the entire array of set-data-objects for this specific pokemon: */
  var individualPokemonSetData = pokemonSets[pkmnName];
  var length = setsForPokemon.length;
  for (var i = 0; i < length; ++i ) {
    /* Because the arrays in teamNumber use the 1-based indexing which is used
    * in the original text data (e.g. Muk1, Muk2, Muk3, Muk4), we subtract 1
    * from the index values: */
    setData[i] = individualPokemonSetData[ setsForPokemon[i]-1 ];
  }
  return setData;
}

/**
 * Toggles the "result-selected" HTML class on an HTML element. This is used
 * as the on-click event handler for rows in the result table, so that the user
 * can click on a particular result to highlight it.
 */
function clickToHighlight (event) {
  /* If the user was dragging to highlight text, don't do anything: */
  if (window.getSelection().type === "Range") {
    return;
  }

  var newClass = "result-selected";
  var oldClass = this.className;
  /* If the element had no existing classes, we can just set our new class
   * as the entire class name: */
  if (oldClass.length === 0) {
    this.className = newClass;
    return;
  }
  /* Otherwise, check if the element has this class already: */
  var locationInString = this.className.indexOf(newClass)
  /* If the class isn't already present, add it: */
  if (locationInString === -1) {
    this.className += " " + newClass
  }
  /* Otherwise, remove the class name: */
  else {
    /* Part before the class we wish to remove:
     * (The -1 removes the space before the class name in the list) */
    this.className = oldClass.substring(0, locationInString-1)
    /* Part after the class we wish to remove: */
    this.className += oldClass.substring(locationInString + newClass.length);
  }
}
/* Use as a mouse-down event on any element to prevent higlighting via
 * double- or triple-clicking. */
function preventClickToHighlight(event) {
  /* If the user was double-clicking, remove the resulting selection: */
  if (event.detail > 1) {
    event.preventDefault();
  }
}

/*
 * HELPER FUNCTIONS:
 */

/**
 * Makes an HTML element with content. This is similar to the
 * document.createElement() method, but allows text or other elements to be
 * added as children in-place.
 *
 * For example:
 * > makeElement("p", "Hello world!");
 * <p>Hello world!</p>
 *
 * > makeElement("span", 3.14);
 * <span>3.14</span>
 *
 * The equivalent using default tools is much longer, and takes at least 2 lines:
 * > var ele = document.createElement("p");
 * > ele.appendChild(document.createTextNode("Hello world!"));
 *
 * makeElement be used without specifying the content parameter, in which case
 * it becomes equivalent to document.createElement.
 *
 * More importantly, the content attribute can be another HTMLElement, in which
 * case the element is appended directly to the newly created element.
 *
 * For example,
 * > var item = makeElement("li", "Get eggs");
 * > makeElement("ul", item)
 * <ul><li>Get eggs</li></p>
 *
 * You can even chain the methods together directly, without intermediate
 * variables:
 * > makeElement("li", makeElement("ul", "Get milk"));
 * <ul><li>Get milk</li></p>
 *
 * NOTE: No special handling is done if content is an array. It will simply
 *   be converted to a string and added to a single element.
 *
 *   If you want to make an array of elements from an array of content items,
 *   use a for loop or the Array.prototype.map() method.
 *
 *   If you want a single element containing an array of elements, use a for
 *   loop or the Array.prototype.forEach() method alongside the
 *   HTMLElement.prototype.appendChild() method.
 */
function makeElement (type, content) {
 /* The new element being populated: */
 var newEle = document.createElement(type);

 /* If no content parameter was passed, leave the element childless:
  *
  * NOTE: This function is basically equivalent to document.createElement()
  * if you use this feature. It's only here for code consistency should you
  * need to create both childed and childless elements */
 if (content === undefined) {
   return newEle;
 }

 /* If content is already an element, just append it directly to newELe: */
 if (content instanceof HTMLElement) {
   newEle.appendChild(content);
 }

 /* Otherwise, coerce content into a string and make a text node out of it.
  * Then, append that text node to newEle: */
 else {
   var text = document.createTextNode(String(content));
   newEle.appendChild(text);
 }
 return newEle;
}

/**
 * Makes a <tr> element containing a <td> element for each value in the entries
 * parameter. If the elementType parameter is specified, then it will be used
 * as the tag instead of "td".
 * For example, a <tr> row of <th> elements can be created by passing "th" for
 * elementType.
 *
 * If entries is not an array, then it will be added to said <td>
 * element via the makeElement method. If it is an array, then one <td> element
 * is created per item in said array, by the same method.
 *
 * NOTE: Nested arrays are NOT treated differently from regular arrays. Each
 *   array within the entires array will have a single <td> element made for it.
 *   Inner arrays are neither flattened nor nested.
 *
 * Examples:
 * > makeTableRow("Hello");
 * <tr><td>Hello</td></tr>
 *
 * > makeTableRow(["Hello", "world!"]);
 * <tr><td>Hello</td><td>world!</td></tr>
 *
 * > makeTableRow(["Hello", "world!"], "th");
 * <tr><th>Hello</th><th>world!</th></tr>
 *
 * > makeTableRow(["Hello", ["world!", "love!"]]);
 * <tr><td>Hello</td><td>world!,love!</td></tr>
 */
function makeTableRow (entries, elementType) {
 /* elementType is an optional parameter to allow users to specify other
  * types for the container of entries. */
 if (elementType === undefined) {
   elementType = "td";
 }

 /* The element which will hold our new table row: */
 var newRow = document.createElement("tr");

 /* If entries is an array, loop through it and add each item to the tr in-
  * order: */
 if (Array.isArray(entries)) {
   var length = entries.length;
   for (var i = 0; i < length; ++i) {
     newRow.appendChild( makeElement(elementType, entries[i]) );
   }
 }
 /* Otherwise, assume we want just a single-element row: */
 else {
   newRow.appendChild( makeElement(elementType, entries) );
 }
 return newRow;
}
