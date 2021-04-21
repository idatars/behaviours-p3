const MAPBOX_ACCESS_CODE = "pk.eyJ1IjoiaWRhdGFycyIsImEiOiJja2w5MHB2dWUwMzYyMndwZmM0djM3ZDVsIn0.T7Tr5He16zekwZXuBL9uUw";
mapboxgl.accessToken = MAPBOX_ACCESS_CODE;
const defaultposn = [-77.0369, 38.895];
const usercolours = ["#FFA011", "#800000", "#314ccd"];
const resultcolor = "#635E54";
const defaulttime = 15;
const defaulttransportation = "walking";
const maxResults = 5;

const SICvalues = {
    icecream: 581203,
    allrestaurants: 581208,
    delicatessen: 581209,
    cafe: 581214,
    sandwiches: 581219,
    tearoom: 581236,
    bar: 581301,
    pub: 581305,
    takeout: 581206
}

document.getElementById("pickFood").addEventListener("change", () => {
    let value = document.getElementById("pickFood").value;
    SICcode = SICvalues[value];
    if (users[0].isochrone != null) search();
});

let SICcode = SICvalues.allrestaurants;
let resultmarkers = [];

// GLOBALS --------------------------------------------------

const maxUsers = 3;
let users = [new User(0)];
let currentuser = 0;

function User(index) {
    this.index = index;
    this.posn = defaultposn;
    this.transportation = defaulttransportation;
    this.minutes = defaulttime;
    this.marker = new mapboxgl.Marker({
        'color': usercolours[index]
    })
    this.loaded = false;
    this.isochrone = null;

    // DOM stuff
    this.boxFillDriving = document.getElementById("boxFillDriving" + index);
    this.boxFillBiking = document.getElementById("boxFillBiking" + index);
    this.boxFillWalking = document.getElementById("boxFillWalking" + index);

    this.walkingIcon = document.getElementById("walkingIcon" + index);
    this.bikingIcon = document.getElementById("bikingIcon" + index);
    this.drivingIcon = document.getElementById("drivingIcon" + index);

    this.tab = document.getElementById("tab" + index);
    this.form = document.getElementById("input" + index);
}

let map;

let geolocation = null;
let geolocationerror = false;

function rendermarker(user) {
    user.marker.setLngLat({
        lon: user.posn[0],
        lat: user.posn[1]
    }).addTo(map);

    map.flyTo({
        center: user.posn,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
}

// INITIAL MAP RENDER ------------------------------------------------------

function onSuccess(position) {
    console.log(position);
    geolocation = [position.coords.longitude, position.coords.latitude];
    users[0].posn = [position.coords.longitude, position.coords.latitude];
    //document.getElementById("currentlocation").checked = true;

    map = new mapboxgl.Map({
        container: 'map', // Specify the container ID
        style: 'mapbox://styles/mapbox/light-v10', // Specify which map style to use
        center: geolocation, // Specify the starting position
        zoom: 13, // Specify the starting zoom
    });
    rendermarker(users[0]);
}

function onError(error) {
    console.log(error);
    geolocationerror = true;
    //document.getElementById("manuallocation").checked = true;

    map = new mapboxgl.Map({
        container: 'map', // Specify the container ID
        style: 'mapbox://styles/mapbox/light-v10', // Specify which map style to use
        center: defaultposn, // Specify the starting position
        zoom: 13, // Specify the starting zoom
    });
}

navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    timeout: 10000,
    enableHighAccuracy: false,
    maximumAge: 0
});

// ISOCHRONE --------------------------------------
// // Create variables to use in getIso()
const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';

// Create a function that sets up the Isochrone API query then makes an Ajax call
function getIso(user) {
    if (user.posn == null) return;
    var query = urlBase + user.transportation + '/' + user.posn[0] + ',' + user.posn[1] + '?contours_minutes=' + user.minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;

    $.ajax({
        method: 'GET',
        url: query
    }).done(function (data) {
        // Set the 'iso' source's data to what's returned by the API query
        map.getSource('iso' + user.index).setData(data);
        user.isochrone = data.features[0].geometry.coordinates[0];
        search();
    })

};

// initially loads the isochrone
function submit() {
    // Make the API call
    for (let i = 0; i < users.length; i++) {
        if (!users[i].loaded) {
            map.addSource('iso' + i, {
                type: 'geojson',
                data: {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            map.addLayer({
                'id': 'isoLayer' + i,
                'type': 'fill',
                // Use "iso" as the data source for this layer
                'source': 'iso' + i,
                'layout': {},
                'paint': {
                    // The fill color for the layer is set to a light purple
                    'fill-color': usercolours[i],
                    'fill-opacity': 0.3
                }
            }, "poi-label");

            getIso(users[i]);
            users[i].loaded = true;
        }
    }
}

document.getElementById("inputform0").addEventListener("submit", submit);
document.getElementById("inputform1").addEventListener("submit", submit);
document.getElementById("inputform2").addEventListener("submit", submit);

// updates the isochrone
function update(e, userindex) {
    let user = users[userindex];
    if (e.target.name == "traveltimeinput" + userindex) {
        user.minutes = e.target.value;
    } else if (e.target.name == "transportation" + userindex) {
        user.transportation = e.target.value;
        if (e.target.value == "walking") {
            user.boxFillWalking.classList.remove("inactiveBox");
            user.walkingIcon.classList.remove("inactiveIcon")
            user.boxFillWalking.classList.add("activeBox");
            user.walkingIcon.classList.add("activeIcon");

            //remove color from unselected buttons, add inactive class
            user.boxFillBiking.classList.remove("activeBox");
            user.boxFillDriving.classList.remove("activeBox");

            user.bikingIcon.classList.remove("activeIcon");
            user.drivingIcon.classList.remove("activeIcon");

            user.boxFillBiking.classList.add("inactiveBox");
            user.boxFillDriving.classList.add("inactiveBox");

            user.bikingIcon.classList.add("inactiveIcon");
            user.drivingIcon.classList.add("inactiveIcon");
            
        } else if (e.target.value == "cycling") {
            // add color to selected button
            user.boxFillBiking.classList.remove("inactiveBox");
            user.bikingIcon.classList.remove("inactiveIcon")
            user.boxFillBiking.classList.add("activeBox");
            user.bikingIcon.classList.add("activeIcon");

            //remove color from unselected buttons, add inactive class
            user.boxFillDriving.classList.remove("activeBox");
            user.boxFillWalking.classList.remove("activeBox");

            user.drivingIcon.classList.remove("activeIcon");
            user.walkingIcon.classList.remove("activeIcon");

            user.boxFillDriving.classList.add("inactiveBox");
            user.boxFillWalking.classList.add("inactiveBox");

            user.drivingIcon.classList.add("inactiveIcon");
            user.walkingIcon.classList.add("inactiveIcon");
        } else if (e.target.value == "driving") {
            // add color to selected button
            user.boxFillDriving.classList.remove("inactiveBox");
            user.drivingIcon.classList.remove("inactiveIcon")
            user.boxFillDriving.classList.add("activeBox");
            user.drivingIcon.classList.add("activeIcon");

            //remove color from unselected buttons, add inactive class
            user.boxFillBiking.classList.remove("activeBox");
            user.boxFillWalking.classList.remove("activeBox");

            user.bikingIcon.classList.remove("activeIcon");
            user.walkingIcon.classList.remove("activeIcon");

            user.boxFillBiking.classList.add("inactiveBox");
            user.boxFillWalking.classList.add("inactiveBox");

            user.bikingIcon.classList.add("inactiveIcon");
            user.walkingIcon.classList.add("inactiveIcon");
        }
    } else if (e.target.name == "locationinput" + userindex) {
        if (e.target.value == "") { //use geolocation
            if (geolocationerror) {
                console.log("how did I end up here");
                return; // add user stuff for this
            }

        } else { // geocode
            if (e.target.value == "") return;
            let query = e.target.value.replace(" ", "%20");

            makeRequest("https://api.mapbox.com/geocoding/v5/mapbox.places/" + query + ".json?proximity=" + user.posn[0] + "," + user.posn[1] + "&access_token=" + MAPBOX_ACCESS_CODE, user);
        }
    }

    if (user.loaded) getIso(user);
}
document.getElementById("inputform0").addEventListener("change", (e) => {update(e, 0)});
document.getElementById("inputform1").addEventListener("change", (e) => {update(e, 1)});
document.getElementById("inputform2").addEventListener("change", (e) => {update(e, 2)});


// GEOCODE
function makeRequest(url, user) {
    httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.onreadystatechange = () => { updatePosn(user) };
    httpRequest.open('GET', url);
    httpRequest.send();
}

function updatePosn(user) {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
            //alert(httpRequest.responseText);
            let result = JSON.parse(httpRequest.responseText);

            user.posn = result.features[0].center;

            rendermarker(user);
            submit();
        } else {
            alert('There was a problem with the request.');
        }
    }
}

// SEARCH

function search() {
    let resultdivs = document.getElementsByClassName("resultsdiv");
    let options = {tolerance: 0.00005, highQuality: false};
    let isochrone = turf.simplify(turf.polygon([users[0].isochrone]), options);
    for (let i = 1; i < users.length; i++) {
        isochrone = turf.intersect(isochrone, turf.polygon([users[i].isochrone]));
    }
    
    for (let i = 0; i < resultmarkers.length; i++) {
        resultmarkers[i].remove();
    }

    for (let i = 0; i < resultdivs.length; i++) {
        resultdivs[i].style.opacity = "";
        document.getElementById("choice" + i).innerHTML = "";
        document.getElementById("choiceAddress" + i).innerHTML = "";
        document.getElementById("restaurantType" + i).innerHTML = "";
    }

    if (isochrone == null) {
        // error handling
        console.log("no no absolutely not");
        return;
    }

    let polygons = isochrone.geometry.coordinates;
    if (polygons.length != 1) {
        polygons.sort(function(a, b){
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
            return b[0].length - a[0].length;
        });
    }
    let results = [];

    console.log(polygons);
    for (let i = 0; i < polygons.length; i++) {
        let curr = polygons[i];
        if (polygons.length != 1) curr = curr[0];
        let string = "";
        for (let j = 0; j < curr.length; j++) {
            if (j != 0) string += ",";
            string = string.concat(curr[j][1] + "," + curr[j][0]);
        }
        const searchbase = "http://www.mapquestapi.com/search/v2/polygon?key=GviXRAtG1HuP7jTZI5WwPpND9Gu7UHfj&ambiguities=ignore&"
        var query = searchbase + "polygon=" + string + "&maxMatches=" + maxResults + "&hostedData=mqap.ntpois|group_sic_code=?|" + SICcode;

        $.ajax({
            method: 'GET',
            url: query,
            dataType: 'jsonp',
        }).done(function (data) {
            if (data.resultsCount == 0 || data.info.statusCode != 0) {
                if (data.info.statusCode != 0) {
                    console.log(i + " " + string);
                }
                // ERROR HANDLING
            } else {
                results = results.concat(data.searchResults);
                console.log(results);
            }

            if (i == polygons.length - 1) {
                let k = 0;
                while (k < results.length) {
                    let curr2 = results[k];
                    document.getElementById("choice" + k).innerHTML = curr2.name;
                    document.getElementById("choiceAddress" + k).innerHTML = curr2.fields.address;
                    document.getElementById("restaurantType" + k).innerHTML = curr2.fields.group_sic_code_name;

                    // Set options
                    resultmarkers.push(new mapboxgl.Marker({
                        color: resultcolor,
                    }).setLngLat([curr2.fields.disp_lng, curr2.fields.disp_lat]).setPopup(new mapboxgl.Popup().setHTML(k)).addTo(map));

                    k++;
                }
                while (k < resultdivs.length) {
                    resultdivs[k].style.opacity = "0";
                    k++;
                }
            }
        });
    }
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    VONNE CODE    @@@@@@@@@@@@@@@@

// defining containers for div switching
let inputContainer = document.getElementById("inputContainer");
let resultsContainer = document.getElementById("resultsContainer");

// defining buddy stuff
let addPic = document.getElementById("addPic"); // pic in bud tab 1
let addBud1 = document.getElementById("addBud1"); //bud tab 1
let removeBud1 = document.getElementById("removeBud1"); // 'x' photo in bud tab 1
let bud1Text = document.getElementById("bud1Text"); // text in bud tab 1
let myLocationTab = document.getElementById("myLocationTab"); // my location tab
let buddy1Tab = document.getElementById("buddy1Tab");


let input = document.getElementById("input"); // bottom div, my location
let input2 = document.getElementById("input2"); // bottom div, bud 1


// switching divs
// your location input
let traveltimeinput = document.getElementById("traveltimeinput");
let resultsDivOn = () => {
    // @@@@@ VONNE CODE
    // switching visibility of divs
    if (traveltimeinput.value >= 1) {
        inputContainer.classList.add("disappear");
        resultsContainer.classList.remove("disappear");
    }
}

function addUser() {
    let newuserindex = users.length;
    if (newuserindex >= maxUsers) {
        // error handling
        return;
    }
    users.push(new User(newuserindex));

    users[newuserindex].tab.classList.remove("disappear");

    let from = users[currentuser];
    let to = users[newuserindex];

    to.tab.classList.add("activeTab");
    to.tab.classList.remove("inactiveTab");

    //deactivate mylocation tab
    from.tab.classList.remove("activeTab");
    from.tab.classList.add("inactiveTab");

    //switch form to bud's form
    to.form.classList.remove("disappear");
    from.form.classList.add("disappear");

    currentuser = newuserindex;
}

document.getElementById("addBud").addEventListener("click", addUser);

function removeUser(index) {
    switchtabs(index, 0);
    users[index].tab.classList.add("disappear");
    if (users[index].isochrone != null) {
        map.removeLayer("isoLayer" + index);
        map.removeSource("iso" + index);
    }
    users[index].marker.remove();
    users.splice(index, 1);
}

document.getElementById("removeBud1").addEventListener("click", (e) => {removeUser(1)});
//document.getElementById("removeBud2").addEventListener("click", (e) => {removeUser(2)});

function switchtabs(fromindex, toindex) {
    if (fromindex == toindex) return;
    let from = users[fromindex];
    let to = users[toindex];

    to.tab.classList.add("activeTab");
    to.tab.classList.remove("inactiveTab");

    //deactivate mylocation tab
    from.tab.classList.remove("activeTab");
    from.tab.classList.add("inactiveTab");

    //switch form to bud's form
    to.form.classList.remove("disappear");
    from.form.classList.add("disappear");

    map.flyTo({
        center: to.posn,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });

    currentuser = toindex;
}

document.getElementById("tab0").addEventListener("click", (e) => {switchtabs(currentuser, 0)});
document.getElementById("tab1").addEventListener("click", (e) => {switchtabs(currentuser, 1)});
//document.getElementById("tab2").addEventListener("click", (e) => {switchtabs(currentuser, 2)});


// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@  RESULTS STUFF
// defining variables
let copyA = document.getElementById("copyA");
let tooltipContainer = document.getElementById("tooltipContainer");

function copyAddress(e) {
    let aux = document.createElement("input");
    let index = e.target.dataset.resultindex;
    aux.setAttribute("value", document.getElementById("choice" + index).innerHTML + " - " + document.getElementById("choiceAddress" + index).innerHTML);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux)
    tooltipContainer.classList.remove("disappear");
    tooltipContainer.classList.add("appear");
    setTimeout(function(){tooltipContainer.classList.remove("appear"); tooltipContainer.classList.add("disppear");}, 1000 ); 
}

let copybuttons = document.getElementsByClassName("linkIcon");
for (let i = 0; i < copybuttons.length; i++) {
    copybuttons[i].addEventListener("click", (e) => { copyAddress(e) });
}

// back button
let backTabs = () => {
    inputContainer.classList.remove("disappear");
    resultsContainer.classList.add("disappear");
    up.classList.remove("rotate");
    up.classList.add("upright");
    myElement.style.bottom = "-20em";

}



// results div up

let up = document.getElementById("up");




// hammer stuff
let myElement = document.getElementById('resultsDiv');

// create a simple instance
// by default, it only adds horizontal recognizers
let mc = new Hammer(myElement);

// // let the pan gesture support all directions.
// // this will block the vertical scrolling on a touch-device while on the element
mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

// // listen to events...
mc.on("panup", function (ev) {
    myElement.style.bottom = "0em";
    console.log("HAMMER");
    up.classList.add("rotate");
    up.classList.remove("upright");
});
mc.on("pandown", function (ev) {
    myElement.style.bottom = "-20em";
    console.log("HAMMER2");
    up.classList.remove("rotate");
    up.classList.add("upright");

    // up.src="img/up.svg";
});
mc.on("panright", function (ev) {
    inputContainer.classList.remove("disappear");
    resultsContainer.classList.add("disappear");
    up.classList.remove("rotate");
    up.classList.add("upright");
    myElement.style.bottom = "-20em";
});




// var myElement = document.getElementById('myElement');

// // create a simple instance
// // by default, it only adds horizontal recognizers
// var mc = new Hammer(myElement);

// // let the pan gesture support all directions.
// // this will block the vertical scrolling on a touch-device while on the element
// mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

// // listen to events...
// mc.on("panleft panright panup pandown tap press", function(ev) {
//     myElement.textContent = ev.type +" gesture detected.";
// });

// ERROR GARBAGE
let errorContainer = document.getElementById("errorContainer");

let errorVis = () => {
    errorContainer.classList.remove("disappear");
    errorContainer.classList.add("appearStay");
}

let closeErrorContainer = () =>{
    errorContainer.classList.remove("appearStay");
    errorContainer.classList.add("disappear");
}

const splash = document.querySelector('.splash');

document.addEventListener('DOMContentLoaded', (e)=>{
  setTimeout(()=>{
      splash.classList.add('display-none');

  }, 2000);
})