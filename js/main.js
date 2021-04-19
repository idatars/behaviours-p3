const MAPBOX_ACCESS_CODE = "pk.eyJ1IjoiaWRhdGFycyIsImEiOiJja2w5MHB2dWUwMzYyMndwZmM0djM3ZDVsIn0.T7Tr5He16zekwZXuBL9uUw";
mapboxgl.accessToken = MAPBOX_ACCESS_CODE;

// GLOBALS --------------------------------------------------
let posn = [-77.0369, 38.895]; //default
let geolocation = null;
let transportation = 'cycling';
let minutes = 10;
let geolocationerror = false;
let map;
let loaded = false;
var marker = new mapboxgl.Marker({
    'color': '#314ccd'
});

function rendermarker() {
    marker.setLngLat({
        lon: posn[0],
        lat: posn[1]
    }).addTo(map);

    map.flyTo({
        center: posn,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
}

// INITIAL MAP RENDER ------------------------------------------------------

function onSuccess(position) {
    console.log(position);
    geolocation = [position.coords.longitude, position.coords.latitude];
    posn = [position.coords.longitude, position.coords.latitude];
    //document.getElementById("currentlocation").checked = true;

    map = new mapboxgl.Map({
        container: 'map', // Specify the container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Specify which map style to use
        center: geolocation, // Specify the starting position
        zoom: 13, // Specify the starting zoom
    });
    rendermarker();
}

function onError(error) {
    console.log(error);
    geolocationerror = true;
    //document.getElementById("manuallocation").checked = true;

    map = new mapboxgl.Map({
        container: 'map', // Specify the container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Specify which map style to use
        center: posn, // Specify the starting position
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
function getIso() {
    var query = urlBase + transportation + '/' + posn[0] + ',' + posn[1] + '?contours_minutes=' + minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;

    $.ajax({
        method: 'GET',
        url: query
    }).done(function (data) {
        // Set the 'iso' source's data to what's returned by the API query
        map.getSource('iso').setData(data);

    })
};

// initially loads the isochrone
function submit(e) {
    if (loaded) return;
    map.addSource('iso', {
        type: 'geojson',
        data: {
            'type': 'FeatureCollection',
            'features': []
        }
    });

    map.addLayer({
        'id': 'isoLayer',
        'type': 'fill',
        // Use "iso" as the data source for this layer
        'source': 'iso',
        'layout': {},
        'paint': {
            // The fill color for the layer is set to a light purple
            'fill-color': '#5a3fc0',
            'fill-opacity': 0.3
        }
    }, "poi-label");

    // Make the API call
    getIso();
    loaded = true;




 

}

document.getElementById("inputform").addEventListener("submit", (e) => submit(e));

// updates the isochrone
document.getElementById("inputform").addEventListener("change", function (e) {
    if (e.target.name == "traveltimeinput") {
        minutes = e.target.value;

    } else if (e.target.name == "transportation") {
        transportation = e.target.value;

    } else if (e.target.name == "locationinput") {
        if (e.target.value == "") { //use geolocation
            if (geolocationerror) {
                console.log("how did I end up here");
                return; // add user stuff for this
            }

        } else { // geocode
            let query = e.target.value.replace(" ", "%20");

            makeRequest("https://api.mapbox.com/geocoding/v5/mapbox.places/" + query + ".json?access_token=" + MAPBOX_ACCESS_CODE);
        }
    }

    if (loaded) getIso();
})


// GEOCODE
function makeRequest(url) {
    httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.onreadystatechange = updatePosn;
    httpRequest.open('GET', url);
    httpRequest.send();
}

function updatePosn() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
            //alert(httpRequest.responseText);
            let result = JSON.parse(httpRequest.responseText);

            posn = result.features[0].center;

            rendermarker();
            if (loaded) getIso();
        } else {
            alert('There was a problem with the request.');
        }
    }
}









//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    VONNE CODE    @@@@@@@@@@@@@@@@

// defining containers for div switching
let inputContainer = document.getElementById("inputContainer");
let resultsContainer = document.getElementById("resultsContainer");





// defining variables for buttons for modes of transportation
let boxFillDriving = document.getElementById("boxFillDriving");
let boxFillBiking = document.getElementById("boxFillBiking");
let boxFillWalking = document.getElementById("boxFillWalking");

let boxFillDriving2 = document.getElementById("boxFillDriving2");
let boxFillBiking2 = document.getElementById("boxFillBiking2");
let boxFillWalking2 = document.getElementById("boxFillWalking2");


let walkingIcon = document.getElementById("walkingIcon");
let bikingIcon = document.getElementById("bikingIcon");
let drivingIcon = document.getElementById("drivingIcon");

let walkingIcon2 = document.getElementById("walkingIcon2");
let bikingIcon2 = document.getElementById("bikingIcon2");
let drivingIcon2 = document.getElementById("drivingIcon2");





// WALKING SELECTED
let walkingSelect = () => {
    {
        // add color to selected button
        boxFillWalking.classList.remove("inactiveBox");
        walkingIcon.classList.remove("inactiveIcon")
        boxFillWalking.classList.add("activeBox");
        walkingIcon.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillBiking.classList.remove("activeBox");
        boxFillDriving.classList.remove("activeBox");

        bikingIcon.classList.remove("activeIcon");
        drivingIcon.classList.remove("activeIcon");

        boxFillBiking.classList.add("inactiveBox");
        boxFillDriving.classList.add("inactiveBox");

        bikingIcon.classList.add("inactiveIcon");
        drivingIcon.classList.add("inactiveIcon");

    }
}

let walkingSelect2 = () => {
    {
        // add color to selected button
        boxFillWalking2.classList.remove("inactiveBox");
        walkingIcon2.classList.remove("inactiveIcon")
        boxFillWalking2.classList.add("activeBox");
        walkingIcon2.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillBiking2.classList.remove("activeBox");
        boxFillDriving2.classList.remove("activeBox");

        bikingIcon2.classList.remove("activeIcon");
        drivingIcon2.classList.remove("activeIcon");

        boxFillBiking2.classList.add("inactiveBox");
        boxFillDriving2.classList.add("inactiveBox");

        bikingIcon2.classList.add("inactiveIcon");
        drivingIcon2.classList.add("inactiveIcon");

    }
}
// BIKING SELECTED
let bikingSelect = () => {
    {
        // add color to selected button
        boxFillBiking.classList.remove("inactiveBox");
        bikingIcon.classList.remove("inactiveIcon")
        boxFillBiking.classList.add("activeBox");
        bikingIcon.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillDriving.classList.remove("activeBox");
        boxFillWalking.classList.remove("activeBox");

        drivingIcon.classList.remove("activeIcon");
        walkingIcon.classList.remove("activeIcon");

        boxFillDriving.classList.add("inactiveBox");
        boxFillWalking.classList.add("inactiveBox");

        drivingIcon.classList.add("inactiveIcon");
        walkingIcon.classList.add("inactiveIcon");

    }
}
let bikingSelect2 = () => {
    {
        // add color to selected button
        boxFillBiking2.classList.remove("inactiveBox");
        bikingIcon2.classList.remove("inactiveIcon")
        boxFillBiking2.classList.add("activeBox");
        bikingIcon2.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillDriving2.classList.remove("activeBox");
        boxFillWalking2.classList.remove("activeBox");

        drivingIcon2.classList.remove("activeIcon");
        walkingIcon2.classList.remove("activeIcon");

        boxFillDriving2.classList.add("inactiveBox");
        boxFillWalking2.classList.add("inactiveBox");

        drivingIcon2.classList.add("inactiveIcon");
        walkingIcon2.classList.add("inactiveIcon");

    }
}
// DRIVING SELECTED
let drivingSelect = () => {
    {
        // add color to selected button
        boxFillDriving.classList.remove("inactiveBox");
        drivingIcon.classList.remove("inactiveIcon")
        boxFillDriving.classList.add("activeBox");
        drivingIcon.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillBiking.classList.remove("activeBox");
        boxFillWalking.classList.remove("activeBox");

        bikingIcon.classList.remove("activeIcon");
        walkingIcon.classList.remove("activeIcon");

        boxFillBiking.classList.add("inactiveBox");
        boxFillWalking.classList.add("inactiveBox");

        bikingIcon.classList.add("inactiveIcon");
        walkingIcon.classList.add("inactiveIcon");

    }
}

let drivingSelect2 = () => {
    {
        // add color to selected button
        boxFillDriving2.classList.remove("inactiveBox");
        drivingIcon2.classList.remove("inactiveIcon")
        boxFillDriving2.classList.add("activeBox");
        drivingIcon2.classList.add("activeIcon");


        //remove color from unselected buttons, add inactive class
        boxFillBiking2.classList.remove("activeBox");
        boxFillWalking2.classList.remove("activeBox");

        bikingIcon2.classList.remove("activeIcon");
        walkingIcon2.classList.remove("activeIcon");

        boxFillBiking2.classList.add("inactiveBox");
        boxFillWalking2.classList.add("inactiveBox");

        bikingIcon2.classList.add("inactiveIcon");
        walkingIcon2.classList.add("inactiveIcon");

    }
}




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
let traveltimeinput=document.getElementById("traveltimeinput");
let resultsDivOn = () => {
       // @@@@@ VONNE CODE
    // switching visibility of divs
if (traveltimeinput.value >= 1){
    inputContainer.classList.add("disappear");
    resultsContainer.classList.remove("disappear");
    console.log("laksd");

}}
// buddy1 input
let traveltimeinput2=document.getElementById("traveltimeinput2");
let resultsDivOn2 = () => {
       // @@@@@ VONNE CODE
    // switching visibility of divs
if (traveltimeinput2.value >= 1){
    inputContainer.classList.add("disappear");
    resultsContainer.classList.remove("disappear");
    console.log("laksd");

}}



// @@@@@@@@@@@@@@@ adding buddy
// 1st buddy tab
let addBuddy1 = () => {

    //BUDDY TAB 1 appear and make active
    
    buddy1Tab.classList.add("activeTab");
    buddy1Tab.classList.remove("inactiveTab");
    buddy1Tab.classList.remove("disappear");

    //deactivate mylocation tab
    myLocationTab.classList.remove("activeTab");
    myLocationTab.classList.add("inactiveTab");

    // switch form to bud's form
    input2.classList.remove("disappear");
    input.classList.add("disappear");

    // addPic.classList.add("disappear");
    // bud1Text.innerHTML = "Buddy 1";
    // removeBud1.classList.remove("disappear"); // toggles x button 
    // addBud1.classList.add("activeTab");
    // addBud1.classList.remove("inactiveTab");
    // myLocationTab.classList.remove("activeTab");
    // myLocationTab.classList.add("inactiveTab");


}

// @@@@@@@@@@@@@ navigating buddy tabs
// 1st buddy tab
let budSwitch1 = () => {

    //BUDDY TAB 1 appear and make active
    
    buddy1Tab.classList.add("activeTab");
    buddy1Tab.classList.remove("inactiveTab");

      //deactivate mylocation tab
      myLocationTab.classList.remove("activeTab");
      myLocationTab.classList.add("inactiveTab");

      console.log("shit");

      //switch form to bud's form
      input2.classList.remove("disappear");
      input.classList.add("disappear");
}

// @@@@@@@@@@@@@ removing buddy
// 1st buddy tab

    //BUDDY TAB 1 disappear
    let removeBuddy1 = () => {
    buddy1Tab.classList.add("disappear");
    buddy1Tab.classList.remove("activeTab");
    buddy1Tab.classList.add("inactiveTab");

    //activate mylocation tab
    myLocationTab.classList.remove("inactiveTab");
    myLocationTab.classList.add("activeTab");

      //switch form to mylocation
      input2.classList.add("disappear");
      input.classList.remove("disappear");
  

 
}



// my location tab 
let myTab = () => {
      //activate mylocation tab
      myLocationTab.classList.remove("inactiveTab");
      myLocationTab.classList.add("activeTab");

      //lower other tabs
      buddy1Tab.classList.remove("activeTab");
      buddy1Tab.classList.add("inactiveTab");

    //switch form to mylocation form
    input2.classList.add("disappear");
    input.classList.remove("disappear");

}



// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@  RESULTS STUFF
// defining variables
let copyA = document.getElementById("copyA");
let tooltipContainer = document.getElementById("tooltipContainer");





// COPYING NAME AND ADDRESS
let copyAddressA = () => {
    let aux = document.createElement("input");
aux.setAttribute("value", document.getElementById("choiceA").innerHTML + " - " + document.getElementById("choiceAddressA").innerHTML);
document.body.appendChild(aux);
aux.select();
document.execCommand("copy");
document.body.removeChild(aux)
tooltipContainer.classList.remove("disappear");
tooltipContainer.classList.add("appear");
console.log("YAAAAA");
// setTimeout(function(){
//     tooltipContainer.classList.remove("appear");
//     tooltipContainer.classList.add("disappear");
// })

}

let copyAddressB = () => {
    let aux = document.createElement("input");
aux.setAttribute("value", document.getElementById("choiceB").innerHTML + " - " + document.getElementById("choiceAddressB").innerHTML);
document.body.appendChild(aux);
aux.select();
document.execCommand("copy");
document.body.removeChild(aux)
}

let copyAddressC = () => {
    let aux = document.createElement("input");
aux.setAttribute("value", document.getElementById("choiceC").innerHTML + " - " + document.getElementById("choiceAddressC").innerHTML);
document.body.appendChild(aux);
aux.select();
document.execCommand("copy");
document.body.removeChild(aux)
}

let copyAddressD = () => {
    let aux = document.createElement("input");
aux.setAttribute("value", document.getElementById("choiceD").innerHTML + " - " + document.getElementById("choiceAddressD").innerHTML);
document.body.appendChild(aux);
aux.select();
document.execCommand("copy");
document.body.removeChild(aux)
}

let copyAddressE = () => {
    let aux = document.createElement("input");
aux.setAttribute("value", document.getElementById("choiceE").innerHTML + " - " + document.getElementById("choiceAddressE").innerHTML);
document.body.appendChild(aux);
aux.select();
document.execCommand("copy");
document.body.removeChild(aux)
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

let up=document.getElementById("up");




// hammer stuff
let myElement = document.getElementById('resultsDiv');

// create a simple instance
// by default, it only adds horizontal recognizers
let mc = new Hammer(myElement);

// // let the pan gesture support all directions.
// // this will block the vertical scrolling on a touch-device while on the element
mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

// // listen to events...
mc.on("panup", function(ev) {
    myElement.style.bottom ="0em";
    console.log("HAMMER");
    up.classList.add("rotate");
    up.classList.remove("upright");
});
mc.on("pandown", function(ev) {
    myElement.style.bottom ="-20em";
    console.log("HAMMER2");
    up.classList.remove("rotate");
    up.classList.add("upright");

    // up.src="img/up.svg";
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