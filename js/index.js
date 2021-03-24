// The name of the starting location. We will have to geocode this to coordinates.
var startingLocation = "1621 Birchwood Drive, Ontario";
// The departure time in an ISO format.
var departureTime = new Date().toJSON();
// Travel time in seconds. We want 1 hour travel time so it is 60 minutes x 60 seconds.
var travelTime = 60 * 20;
// These secret variables are needed to authenticate the request. Get them from http://docs.traveltimeplatform.com/overview/getting-keys/ and replace 
var APPLICATION_ID = "c2928efa";
var API_KEY = "71df45142247f399b1e64f949681cf06";

var mymap = L.map('mapid').setView([38.8, -77.0365], 9);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiaWRhdGFycyIsImEiOiJja2w5MHB2dWUwMzYyMndwZmM0djM3ZDVsIn0.T7Tr5He16zekwZXuBL9uUw'
}).addTo(mymap);

sendGeocodingRequest(startingLocation);

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
                sendTimeMapRequest(xhr.response)
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
function sendTimeMapRequest(geocodingResponse) {


    // The request for Time Map. Reference: http://docs.traveltimeplatform.com/reference/time-map/
    var coords = geocodingResponse.features[0].geometry.coordinates;
    console.log("coords");
    var latLng = { lat: coords[1], lng: coords[0] };

    var request = {
        departure_searches: [{
            id: "first_location",
            coords: latLng,
            transportation: {
                type: "public_transport"
            },

            departure_time: departureTime,
            travel_time: travelTime
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