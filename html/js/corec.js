$(function() {

  function initCurrentActivityCharts() {
    /* 'https://www.purdue.edu/DRSFacilityUsageAPI/currentactivity/' JSON response looks like:
    [{
    	"LocationId": "61b3abc1-bb87-413b-b933-827bc6d58e0f",
    	"LocationName": "Colby Strength",
    	"ZoneId": "19d3ae76-7e6b-4ef1-8fcf-27b4537d6cfc",
    	"ZoneName": "Basement",
    	"Capacity": 100,
    	"Headcount": 27,
    	"EntryDate": "2017-02-14T07:13:44.337"
    },{},{}...]
    Seems like it doesn't matter wether a LocationId is passed to this, data returns for all locations...need to investigate this more
    */
    var spinner = new Spinner({
      length: 5
    }).spin();
    $('#currentactivity').append(spinner.el);

    var url = "https://www.purdue.edu/DRSFacilityUsageAPI/" + "currentactivity";
    var url2 = "https://www.purdue.edu/DRSFacilityUsageAPI/" + "locations";

    var currentactivityData, locationData;
    $.when(
      $.getJSON(url, function(data) {
        currentactivityData = data;
      }),
      $.getJSON(url2, function(data) {
        locationData = data;
      })
    ).then(function() {
      if (currentactivityData && locationData) {
        viewCurrentActivityCharts(currentactivityData, locationData);
        spinner.stop();
      }
      else {
        // Request for web data didn't work, handle it
        console.log("Error gettting data from either: url: " + url + " or url2: " + url2);
      }
    });
  }
  
  var app = window.app || {};
  window.app = app;
});
