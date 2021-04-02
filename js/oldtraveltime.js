// The name of the starting location. We will have to geocode this to coordinates.
var startingLocation = "1621 Birchwood Drive, Ontario";
// The departure time in an ISO format.
var departureTime = new Date().toJSON();
// Travel time in seconds. We want 1 hour travel time so it is 60 minutes x 60 seconds.
var travelTime = 60 * 20;
// These secret variables are needed to authenticate the request. Get them from http://docs.traveltimeplatform.com/overview/getting-keys/ and replace 
const APPLICATION_ID = "c2928efa";
const API_KEY = "71df45142247f399b1e64f949681cf06";

let mymap = L.map('mapid');
let marker;
let posn = null; // latLng
let geolocationerror = false;


function latLngtoArr(latLng) {
    return [latLng.lat, latLng.lng];
}

// MAP SETUP ---------------------------------------
function onSuccess(position) {
    console.log(position);
    posn = { lat: position.coords.latitude, lng: position.coords.longitude};
    mymap.setView(latLngtoArr(posn), 9);
    marker = L.marker(latLngtoArr(posn)).addTo(mymap);
    document.getElementById("currentlocation").checked = true;
}

function onError(error) {
    //alert("code: " + error.code + "\nmessage: " + error.message);
    console.log(error);
    mymap.setView([0, 0], 9);
    geolocationerror = true;
    document.getElementById("manuallocation").checked = true;
}

navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout:10000, enableHighAccuracy: false, maximumAge: 0});

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiaWRhdGFycyIsImEiOiJja2w5MHB2dWUwMzYyMndwZmM0djM3ZDVsIn0.T7Tr5He16zekwZXuBL9uUw'
}).addTo(mymap);

function submit(e) {
    e.preventDefault();

    if (document.getElementById("currentlocation").checked) {
        if (geolocationerror) { // LOCATION DID NOT WORK
            return;
        }
        let travelmethod = "public_transport";
        sendTimeMapRequest(posn, document.getElementById("traveltimeinput").value * 60, travelmethod);

    } else if (document.getElementById("manuallocation").checked) {
        sendGeocodingRequest(document.getElementById("locationinput").value);
    }
}

document.getElementById("inputform").addEventListener("submit", (e) => submit(e));


// ISOCHRONE

//sendGeocodingRequest(startingLocation);

// Sends the geocoding request.
function sendGeocodingRequest(location) {
    // The request for the geocoder. Reference: http://docs.traveltimeplatform.com/reference/geocoding-search/
    var request = {
        query: location
    };
    document.getElementById("error").style.display = "none";
    var xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open("GET", "https://api.traveltimeapp.com/v4/geocoding/search?query=" + location)
    xhr.setRequestHeader("X-Application-Id", APPLICATION_ID);
    xhr.setRequestHeader("X-Api-Key", API_KEY);
    xhr.setRequestHeader("Accept-Language", " en-US");
    xhr.setRequestHeader("Access-Control-Allow-Origin", null);
    xhr.onreadystatechange = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            if (xhr.readyState === 4) {
                var coords = xhr.response.features[0].geometry.coordinates;
                posn = { lat: coords[1], lng: coords[0] };
                mymap.setView(latLngtoArr(posn), 9);
                marker = L.marker(latLngtoArr(posn)).addTo(mymap);
                let travelmethod = "public_transport";
                sendTimeMapRequest(posn, document.getElementById("traveltimeinput").value * 60, travelmethod);
            }
        } else {
            if (APPLICATION_ID === "place your app id here" || API_KEY === "place your api key here") {
                document.getElementById("error").style.display = "block";
            }
        }
    };
    xhr.send();
};

// Sends the request of the Time Map multipolygon.
function sendTimeMapRequest(latLng, traveltime, travelmethod) {


    // The request for Time Map. Reference: http://docs.traveltimeplatform.com/reference/time-map/

    var request = {
        departure_searches: [{
            id: "first_location",
            coords: latLng,
            transportation: {
                type: travelmethod
            },

            departure_time: departureTime,
            travel_time: traveltime
        }],

        arrival_searches: []
    };

    var xhr = new XMLHttpRequest()
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            drawTimeMap(mymap, this.response);
        }
    });
    xhr.open("POST", "https://api.traveltimeapp.com/v4/time-map")
    xhr.setRequestHeader("X-Application-Id", APPLICATION_ID);
    xhr.setRequestHeader("X-Api-Key", API_KEY);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.responseType = "json";
    xhr.send(JSON.stringify(request));


    // A helper function that converts [{lat: <lat>, lng: <lng>}, ...] to a [[<lat>, <lng>], ...] format.
    function ringCoordsHashToArray(ring) {
        return ring.map(function (latLng) { return [latLng.lat, latLng.lng]; });
    };


    // Draws the resulting multipolygon from the response on the map.
    function drawTimeMap(map, response) {

        // Reference for the response: http://docs.traveltimeplatform.com/reference/time-map/#response-body-json-attributes
        var shapesCoords = response.results[0].shapes.map(function (polygon) {
            var shell = ringCoordsHashToArray(polygon.shell);
            var holes = polygon.holes.map(ringCoordsHashToArray);
            return [shell].concat(holes);
        });
        var polygon = L.polygon(shapesCoords, { color: 'red' });
        polygon.addTo(map);
        map.fitBounds(polygon.getBounds());

    };
}