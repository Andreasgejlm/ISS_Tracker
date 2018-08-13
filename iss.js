class ISS {

  constructor(satellite, tleData, predict){
  this.predict = predict;
  this.tleData = tleData, this.tle1 = "", this.tle2 = "";
  this.satellite = satellite;
  this.issPos = {}, this.issAngles = {}, this.userPos = {}, this.observerGd = {};
  this.nextPassStr = "";
  this.popupFlag = false;
  this.polyline = {};

  this.icon = L.icon({
    iconUrl: 'libraries/issIcon.png',
    iconSize:     [80, 80], // size of the icon
    iconAnchor:   [50, 50], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


  this.iconMarker = {};

  this.updateTLE();
  this.updateIssData();
}
  updateTLE() {
    this.tle1 = this.tleData.line1;
    this.tle2 = this.tleData.line2;
  }

  updateIssData() {
    let satrec = this.satellite.twoline2satrec(this.tle1, this.tle2);
    let positionAndVelocity = this.satellite.propagate(satrec, new Date());

    let positionEci = positionAndVelocity.position;
    let now = new Date();
    let gmst = this.satellite.gstime(now);
    let positionGd = this.satellite.eciToGeodetic(positionEci, gmst);


    let issLat = this.satellite.degreesLat(positionGd.latitude);
    let issLng = this.satellite.degreesLong(positionGd.longitude);
    let issHeight = positionGd.height;

    this.issPos = {
      lat:    issLat,
      lng:    issLng,
      height: issHeight
    };

    if (this.observerGd != undefined) {
      this.updateViewingAngle(positionEci);
    }

  }



  setCurrentPosition(lat, long, map) {
    this.userPos = {
      lat: lat,
      lng: long
    };

    let deg2rad = PI / 180.0;
    this.observerGd = {
      latitude:  lat * deg2rad,
      longitude: long * deg2rad,
      height: 200
    }
  }

  updateViewingAngle(Eci) {

    let gmst = this.satellite.gstime(new Date());
    let positionEcf = this.satellite.eciToEcf(Eci, gmst);
    let lookAngles  = this.satellite.ecfToLookAngles(this.observerGd, positionEcf);

    let issAzimuth   = lookAngles.azimuth;
    let issElevation = lookAngles.elevation;
    let issRangeSat  = lookAngles.rangeSat;

    this.issAngles = {
      azimuth: issAzimuth,
      elevation: issElevation,
      rangeSat: issRangeSat
    };

  }

  update(map) {
    this.updateIssData();
    this.draw(map);

  }

  draw(map) {
    if (this.iconMarker != undefined) {
        map.removeLayer(this.iconMarker);
    }
    this.iconMarker = L.marker([this.issPos.lat, this.issPos.lng], {icon: this.icon}).addTo(map);


    if ((this.userPos.lat || this.userPos.lng) && !this.popupFlag) {
      let circle = L.circle([this.userPos.lat, this.userPos.lng], {
        fillColor: '#648bff',
        fillOpacity: 0.5,
        stroke: false,
        radius: 800000
      }).addTo(map);
      let circle1 = L.circle([this.userPos.lat, this.userPos.lng], {
        fillColor: '#648bff',
        fillOpacity: 1,
        radius: 80000
      }).addTo(map);

      this.nextPassStr = this.next_pass();
      circle.bindPopup("<b>Next pass over:</b><br>" + new Date(this.nextPassStr)).openPopup();
      // FIX: Den skal ikke poppe op hele tiden
      this.popupFlag = true;
    }


    this.updateFlightPath(new Date().getTime(), 90, map);

  }

  next_pass() {
    let tle = "fill" + "\n" + this.tle1 + "\n" + this.tle2;
    let qth = [this.userPos.lat, this.userPos.lng, 0.2];
    let passData = this.predict.transits(tle, qth, new Date().getTime(), new Date().getTime()+ 24*60*60*1000, 10, 1);
    return passData[0].start;
  }




  updateFlightPath(now, incMin, map) {
    let plotStart = now - 0.25 * 60 * 60 * 1000;
    let plotEnd = plotStart + incMin/60 * 60 * 60 * 1000;
    let latlngs = new Array();
    let satrec = this.satellite.twoline2satrec(this.tle1, this.tle2);

    let plotArray = this.getPlotArray(plotStart, plotEnd, satrec);

    for (let j = 1; j < plotArray.length; j++) {
      if (plotArray[j][1] < plotArray[j-1][1]) {
        let bArray = plotArray.splice(j, incMin-j);
        latlngs = [plotArray, bArray];
        break;
      }
    }

    if (!this.isEmpty(this.polyline)) {
      for (let k = 0; k < 2; k++) {
        map.removeLayer(this.polyline[k]);
      }
    }

    for (let l = 0; l < latlngs.length; l++) {
      this.polyline[l] = L.polyline(latlngs[l], {color: '#4f5a66', smoothFactor: 0}).addTo(map);
    }

    plotArray = [];
    latlngs = [];
  }



  getPlotArray(plotStart, plotEnd, satrec) {
    let tempPlotArray = new Array();
    for (let i = plotStart; i < plotEnd; i += 60000) {
      let time = new Date(i);
      let posAndVel = this.satellite.propagate(satrec, time);
      let Eci = posAndVel.position;
      let gmst = this.satellite.gstime(time);
      let positionGd = this.satellite.eciToGeodetic(Eci, gmst);
      let lng = this.satellite.degreesLong(positionGd.longitude);
      let lat = this.satellite.degreesLong(positionGd.latitude);
      tempPlotArray.push([lat, lng]);
    }
    return tempPlotArray;
  }

  isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

}
