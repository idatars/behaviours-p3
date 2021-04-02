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
    marker.setLngLat({ lon: posn[0], lat: posn[1] }).addTo(map);

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

navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 });

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