// Satellite records
let satrec;

// Position and velocity at specified time
let positionAndVelocity;

// TLE url
let TLEurl;

let iss;

let tleData;

let mymap;
let time;

function preload() {
  let tleURL = 'https://api.wheretheiss.at/v1/satellites/25544/tles';
  tleData = loadJSON(tleURL);
  
}

function setup() {
  iss = new ISS(satellite, tleData, jspredict);
  time = millis();

  mymap = L.map('mapid').setView([51.505, -0.09], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mymap);

  updateCurrentPosition(mymap);
}



function draw() {
  if (millis() > time + 500) {
    iss.update(mymap);
    time = millis();
  }
}


function updateCurrentPosition(map) {
  if (!navigator.geolocation){
    console.log("Not supported");
    return;
  }
  navigator.geolocation.getCurrentPosition(function(position) {
    iss.setCurrentPosition(position.coords.latitude, position.coords.longitude, map);
  });
}
