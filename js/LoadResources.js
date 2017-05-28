/* A function for acquiring text file contents from a server: */
function AJAXTextLoader(responseCallBack, dataURL) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) { //Code for "Good"
        responseCallBack(httpRequest.responseText);
      } else {
        console.error("AJAX attempt failed. Error code: " + httpRequest.status);
        console.log("Things might still load, though. Multiple attempts are made per resource.");
      }
    }
  }
  httpRequest.open("GET", dataURL);
  httpRequest.send();
}

/* Here we use AJAX to acquire all necessary data for search: */

/* Counts how many resources have already loaded, so that we can know when
 * everything is finished loading. Then, we can call the search() method
 * immediately, in-case the user has already typed something into the interface:*/
window.resourcesLoaded = 0;
window.trainerToTeam; //Maps Trainer names to the number for the team they use
AJAXTextLoader(
    function(responseText){
      trainerToTeam = JSON.parse(responseText);
      console.log("Trainer teams ready!");
      /* Attempting to do the search, in case the user already typed their
       * query: */
      ++resourcesLoaded;
      if (resourcesLoaded >= 3) search();
    },
    "data/trainerToTeam.json"
);
window.teamContents; //Data about which pokemon each set contains
AJAXTextLoader(
    function(responseText){
      teamContents = JSON.parse(responseText);
      console.log("Team data ready!");
      ++resourcesLoaded;
      if (resourcesLoaded >= 3) search();
    },
    "data/teamContents.json"
);
/* Data about each set for each Pokemon (items, movesets, etc.): */
window.pokemonSets;
AJAXTextLoader(
    function(responseText){ /* Parse through text file right away: */
      pokemonSets = JSON.parse(responseText);
      console.log("Pokemon set data ready!");
      ++resourcesLoaded;
      if (resourcesLoaded >= 3) search();
    },
    "data/pokemonSets.json"
);
