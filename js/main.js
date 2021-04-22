// Written by Vonne and Isabel :)

// GLOBALS CONSTANTS --------------------------------------------------
const MAPBOX_ACCESS_CODE = "pk.eyJ1IjoiaWRhdGFycyIsImEiOiJja2w5MHB2dWUwMzYyMndwZmM0djM3ZDVsIn0.T7Tr5He16zekwZXuBL9uUw";
const defaultposn = [-79.3832, 43.6532]; // Toronto
const usercolours = ["#FFA011", "#800000", "#6A7A5B"];
const resultcolor = "#635E54";
const defaulttime = 15;
const defaulttransportation = "walking";
const maxResults = 5;
const maxUsers = 3;
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

// GLOBAL DATA --------------------------------------------------
let users = [new User(0), new User(1), new User(2)];
let currentuser = 0;
let SICcode = SICvalues.allrestaurants;
let resultmarkers = [];
let resulterror = false;
let geolocation = null;
let geolocationerror = false;
let map;
mapboxgl.accessToken = MAPBOX_ACCESS_CODE;

// USER CLASS --------------------------------------------------
function User(index) {
    this.index = index;
    this.posn = null;
    this.transportation = defaulttransportation;
    this.minutes = defaulttime;
    this.loaded = false; // do not remove or it will bug
    this.isochrone = null;
    this.marker = new mapboxgl.Marker({
        'color': usercolours[index]
    })
    if (index == 0) this.active = true;
    else this.active = false;

    // DOM pointers
    this.boxFillDriving = document.getElementById("boxFillDriving" + index);
    this.boxFillBiking = document.getElementById("boxFillBiking" + index);
    this.boxFillWalking = document.getElementById("boxFillWalking" + index);
    this.walkingIcon = document.getElementById("walkingIcon" + index);
    this.bikingIcon = document.getElementById("bikingIcon" + index);
    this.drivingIcon = document.getElementById("drivingIcon" + index);
    this.tab = document.getElementById("tab" + index);
    this.form = document.getElementById("input" + index);
}

// Renders the marker of the given User
function rendermarker(user) {
    if (user.posn == null) {
        console.log("Failed to render marker for user #" + user.index + ", position is null");
        return;
    }

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
const splash = document.querySelector('.splash');

function onSuccess(position) {
    console.log(position);
    geolocation = [position.coords.longitude, position.coords.latitude];
    users[0].posn = [position.coords.longitude, position.coords.latitude];

    setTimeout(() => {splash.classList.add('display-none'); loadIso(users[0]);}, 2000);
      
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

    setTimeout(() => {splash.classList.add('display-none');}, 2000);

    map = new mapboxgl.Map({
        container: 'map', // Specify the container ID
        style: 'mapbox://styles/mapbox/light-v10', // Specify which map style to use
        center: defaultposn, // Specify the starting position
        zoom: 13, // Specify the starting zoom
    });
}

// basically main()
navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    timeout: 7000,
    enableHighAccuracy: false,
    maximumAge: 0
});

// ISOCHRONE --------------------------------------
const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';

function loadIso(user) {
    if (user.posn == null || user.loaded) {
        if (user.posn == null) console.log("Failed to load isochrone for user #" + user.index + ", position is null");
        if (user.loaded) console.log("Failed to load isochrone for user #" + user.index + ", isochrone is already loaded");
        return;
    }

    map.addSource('iso' + user.index, {
        type: 'geojson',
        data: {
            'type': 'FeatureCollection',
            'features': []
        }
    });

    map.addLayer({
        'id': 'isoLayer' + user.index,
        'type': 'fill',
        'source': 'iso' + user.index,
        'layout': {},
        'paint': {
            'fill-color': usercolours[user.index],
            'fill-opacity': 0.3
        }
    }, "poi-label");

    user.loaded = true;
    getIso(user);
}

// renders User's isochrone if loaded, then calls search()
function getIso(user) {
    if (user.posn == null || !user.loaded) {
        if (user.posn == null) console.log("Failed to render isochrone for user #" + user.index + ", position is null");
        if (!user.loaded) console.log("Failed to render isochrone for user #" + user.index + ", isochrone is not loaded");
        return;
    }

    var query = urlBase + user.transportation + '/' + user.posn[0] + ',' + user.posn[1] + '?contours_minutes=' + user.minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;

    $.ajax({
        method: 'GET',
        url: query
    }).done(function (data) {
        map.getSource('iso' + user.index).setData(data);
        user.isochrone = data.features[0].geometry.coordinates[0];
        search();
    })
};

// updates isochrone parameters, then loads isochrone if necessary and calls getIso
function update(e, userindex) {
    let user = users[userindex];

    // make changes to parameters
    if (e.target.name == "traveltimeinput" + userindex) {
        user.minutes = e.target.value;
    } else if (e.target.name == "transportation" + userindex) {
        user.transportation = e.target.value;
        if (e.target.value == "walking") {
            // add color to selected button
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
            if (userindex != 0) { // geolocation invalid bc not main user, reset user basically
                if (user.isochrone != null) {
                    map.removeLayer("isoLayer" + userindex);
                    map.removeSource("iso" + userindex);
                    user.isochrone = null;
                    user.loaded = false;
                }
                user.posn = null;
                user.marker.remove();
                search();
                return;
            } else if (geolocationerror) {
                console.log("Unable to use geolocation");
                errorVis("Unable to use your location, try entering your address manually!");
                return;
            } else user.posn = geolocation;
        } else { // geocode
            if (e.target.value == "") return;
            let query = e.target.value.replace(" ", "%20");

            makeRequest("https://api.mapbox.com/geocoding/v5/mapbox.places/" + query + ".json?proximity=" + defaultposn[0] + "," + defaultposn[1] + "&access_token=" + MAPBOX_ACCESS_CODE, user);
            return;
        }
    }

    if (user.loaded) getIso(user);
    else loadIso(user);
}
document.getElementById("inputform0").addEventListener("change", (e) => {update(e, 0)});
document.getElementById("inputform1").addEventListener("change", (e) => {update(e, 1)});
document.getElementById("inputform2").addEventListener("change", (e) => {update(e, 2)});

document.getElementById("pickFood").addEventListener("change", () => {
    let value = document.getElementById("pickFood").value;
    SICcode = SICvalues[value];
    if (users[0].isochrone != null) search();
});

// GEOCODE
function makeRequest(url, user) {
    httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        errorVis('Cannot create an XMLHTTP instance to geocode your location!');
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
            if (user.loaded) getIso(user);
            else loadIso(user);
        } else {
            console.log(httpRequest)
            errorVis('Unable to geocode your location');
        }
    }
}

// SEARCH
function search() { // free me please i can't do this anymore
    let resultdivs = document.getElementsByClassName("resultsdiv");
    let options = {tolerance: 0.00005, highQuality: false};

    if (users[0].isochrone == null) {
        errorVis("Error in getting results!");
        console.log("Error in getting results, user #0 isochrone is null");
        resulterror = true;
        return;
    }
    
    for (let i = 0; i < resultmarkers.length; i++) resultmarkers[i].remove();

    for (let i = 0; i < resultdivs.length; i++) {
        resultdivs[i].style.opacity = "";
        document.getElementById("choice" + i).innerHTML = "";
        document.getElementById("choiceAddress" + i).innerHTML = "";
        document.getElementById("restaurantType" + i).innerHTML = "";
    }

    let isochrone = turf.simplify(turf.polygon([users[0].isochrone]), options);
    for (let i = 1; i < users.length; i++) {
        if (users[i].posn != null && users[i].isochrone != null && users[i].active) {
            isochrone = turf.intersect(isochrone, turf.polygon([users[i].isochrone]));
        }
    }

    if (isochrone == null) {
        errorVis("No intersections between all users!");
        resulterror = true;
        return;
    }

    let polygons = isochrone.geometry.coordinates;
    if (polygons.length != 1) polygons.sort(function(a, b) {return b[0].length - a[0].length;});
    
    let results = [];

    for (let i = 0; i < polygons.length; i++) {
        let string = "";
        let curr = polygons[i];
        if (polygons.length != 1) curr = curr[0];

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
                if (data.info.statusCode != 0) console.log("Error for polygon #" + i + ", status code " + data.info.statusCode);
            } else results = results.concat(data.searchResults);

            if (results.length == 0) {
                errorVis("No results for your selection!");
                resulterror = true;
                backTabs();
                return;
            }

            if (i == polygons.length - 1) {
                let k = 0;
                while (k < results.length) {
                    let curr2 = results[k];
                    document.getElementById("choice" + k).innerHTML = curr2.name;
                    document.getElementById("choiceAddress" + k).innerHTML = curr2.fields.address;
                    document.getElementById("restaurantType" + k).innerHTML = curr2.fields.group_sic_code_name;

                    resultmarkers.push(new mapboxgl.Marker({color: resultcolor})
                    .setLngLat([curr2.fields.disp_lng, curr2.fields.disp_lat])
                    .setPopup(new mapboxgl.Popup().setHTML(k)).addTo(map));

                    k++;
                }
                while (k < resultdivs.length) {
                    resultdivs[k].style.opacity = "0";
                    k++;
                }
                resulterror = false;
            }
            if (resulterror) backTabs();
        }).fail(function() {
            errorVis("Unable to retrieve results for your selection");
            resulterror = true;
            backTabs();
        });
    }
}

// INTERFACE --------------------------------------------------------
const inputContainer = document.getElementById("inputContainer");
const resultsContainer = document.getElementById("resultsContainer");

// switches to result screen if the results are valid
let resultsDivOn = () => {
    if (resulterror) {
        errorVis("Unable to get your results, try adjusting the parameters!");
        return;
    }
    if (users[0].posn == null) {
        errorVis("Unable to get your location, please enter it manually!");
        return;
    }
    inputContainer.classList.add("disappear");
    resultsContainer.classList.remove("disappear");
}

// adds user if there is space
function addUser() {
    let newuserindex = null;
    for (let i = 0; i < users.length; i++) {
        if (!users[i].active) {
            newuserindex = i;
            break;
        }
    }

    if (newuserindex == null) {
        errorVis("Max number of users already reached!");
        return;
    }

    users[newuserindex].active = true;
    users[newuserindex].tab.classList.remove("disappear");

    let from = users[currentuser];
    let to = users[newuserindex];

    to.tab.classList.add("activeTab");
    to.tab.classList.remove("inactiveTab");
    from.tab.classList.remove("activeTab");
    from.tab.classList.add("inactiveTab");
    to.form.classList.remove("disappear");
    from.form.classList.add("disappear");

    currentuser = newuserindex;
}
document.getElementById("addBud").addEventListener("click", addUser);

// resets user at the given index, then calls search()
function resetUser(index) {
    switchtabs(index, 0);
    users[index].tab.classList.add("disappear");
    if (users[index].isochrone != null) {
        map.removeLayer("isoLayer" + index);
        map.removeSource("iso" + index);
    }
    users[index].marker.remove();
    
    users[index] = new User(index);

    document.getElementById("locationinput" + index).value = "";
    search();
}
document.getElementById("removeBud1").addEventListener("click", (e) => {resetUser(1)});
document.getElementById("removeBud2").addEventListener("click", (e) => {resetUser(2)});

// switches tabs unless indexes are the same
function switchtabs(fromindex, toindex) {
    if (fromindex == toindex) return;
    let from = users[fromindex];
    let to = users[toindex];

    to.tab.classList.add("activeTab");
    to.tab.classList.remove("inactiveTab");
    from.tab.classList.remove("activeTab");
    from.tab.classList.add("inactiveTab");
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
document.getElementById("tab2").addEventListener("click", (e) => {switchtabs(currentuser, 2)});


// RESULTS SCREEN ------------------------------------------
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

let backTabs = () => {
    inputContainer.classList.remove("disappear");
    resultsContainer.classList.add("disappear");
    up.classList.remove("rotate");
    up.classList.add("upright");
    myElement.style.bottom = "-20em";
}

// HAMMER ----------------------------------------------------------
let myElement = document.getElementById('resultsDiv');
let locationDiv0 = document.getElementById('input0');
let locationDiv1 = document.getElementById('input1');
let locationDiv2 = document.getElementById('input2');

let mc = new Hammer(myElement);
let div0 = new Hammer(locationDiv0);
let div1 = new Hammer(locationDiv1);
let div2 = new Hammer(locationDiv2);

// let the pan gesture support all directions.
// this will block the vertical scrolling on a touch-device while on the element
mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
div0.get('pan').set({ direction: Hammer.DIRECTION_ALL });
div1.get('pan').set({ direction: Hammer.DIRECTION_ALL });
div2.get('pan').set({ direction: Hammer.DIRECTION_ALL });

mc.on("panup", function (ev) {
    myElement.style.bottom = "0em";
    up.classList.add("rotate");
    up.classList.remove("upright");
});

mc.on("pandown", function (ev) {
    myElement.style.bottom = "-20em";
    up.classList.remove("rotate");
    up.classList.add("upright");
});

mc.on("panright", backTabs);

div0.on("panleft", resultsDivOn);
div1.on("panleft", resultsDivOn);
div2.on("panleft", resultsDivOn);

// results div up
let up = document.getElementById("up");
let resultsUp = () => {
    if (myElement.classList.contains("divDown")){
        myElement.style.bottom = "0em";
        up.classList.add("rotate");
        up.classList.remove("upright");
        myElement.classList.remove("divDown");
        myElement.classList.add("divUp");

    } else {
        myElement.style.bottom = "-20em";
        up.classList.remove("rotate");
        up.classList.add("upright");
        myElement.classList.remove("divUp");
        myElement.classList.add("divDown");
    }
}

// ERROR GARBAGE -------------------------------------------------------
let errorContainer = document.getElementById("errorContainer");

let errorVis = (message) => {
    errorContainer.classList.remove("disappear");
    errorContainer.classList.add("appearStay");
    document.getElementById("errortext").innerHTML = message;
}

let closeErrorContainer = () => {
    errorContainer.classList.remove("appearStay");
    errorContainer.classList.add("disappear");
}