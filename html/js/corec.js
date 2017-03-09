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

  function viewCurrentActivityCharts(data, data2) {
    if(typeof data == 'undefined') {
      return null;
    }

    var entrydates = {};
    var capacities = {};
    var headcounts = {};
    var locationnames = {};
    var zones = {};
    var zonenames = {};
    var lastupdatedtimes = {};
    var tabcount = 0;
    var lastZoneId = "";



    for (var area in data) {
      console.log(area);
      if (lastZoneId != data[area].ZoneId) {
        lastZoneId = data[area].ZoneId;
        tabcount++;
        var tab = $(
          "<li><a href='#tabs-" + tabcount + "' role='tab' data-toggle='tab'>" + data[area].ZoneName + "</a></li>"
        );
        tab.appendTo("#tabs");
        var tabsection = $(
          "<div id='tabs-" + tabcount + "' class='tab-pane'></div>"
        );
        tabsection.appendTo("#tab-panes");
      }
      if(data[area].Capacity == null){
        capacities[data[area].LocationId] = 0;
      }
      else {
        capacities[data[area].LocationId] = parseInt(data[area].Capacity);
      }
      if(data[area].Headcount == null){
        headcounts[data[area].LocationId] = 0;
      }
      else {
        headcounts[data[area].LocationId] = parseInt(data[area].Headcount);
      }

      locationnames[data[area].LocationId] = data[area].LocationName;
      zones[data[area].LocationId] = tabcount;
      zonenames[data[area].LocationId] = data[area].ZoneName;
      entrydates[data[area].LocationId] = data[area].EntryDate;


    }

    var chartdata = [];

    for (var key in headcounts) {
      if(capacities[key] < headcounts[key]){
        freeSpace = 0;
      }
      else {
        freeSpace = capacities[key] - headcounts[key];
      }

      var color;
      if(headcounts[key] / capacities[key] >= 0.8) {
        color = "red";
      } else if(headcounts[key] / capacities[key] >= 0.6) {
        color = "orange";
      } else {
        color = "green";
      }



        var HTML = "<div class='chartitem col-xs-12'>";
        HTML += "<div class='row'>";
        HTML += "<a onclick='app.initTrendsCharts(\"" + key + "\");'>";
        HTML += "<h2 class='chartcaption capitalized col-xs-6'><span class='chartcaption-title'>" + locationnames[key] + "</span>";
        HTML += "<div class='chartcaption-data'>";
        if (headcounts[key] != '0') {
          HTML += headcounts[key];
          HTML += " / "
          HTML += capacities[key];
        }
        console.log(key);

        if(headcounts[key] == '0') {
          HTML += "<div class='chartcaption-data'><span class='label label-success'>Empty</span></div>";
        }
        HTML += "</div>";
        HTML += "</h2>";
        HTML += "<div class='col-xs-6 chart' id=" + key + ">";
        HTML += "<canvas id='chart" + key + "' width='100' height='100'></canvas>";
        HTML += "</div>";
        HTML += "</a>";
        HTML += "</div>";
        if(entrydates[key] != null){
          HTML += "<div class='smaller'>Last updated " + moment(entrydates[key]).format('h:mm a');+"</div>"
        }
        else {
          HTML += "<div class='smaller'>Last updated " + moment(lastupdatedtimes[key]).format('h:mm a');+"</div>"
        }
        HTML += "</div>";
        var chartitem = $(HTML);
        chartitem.appendTo("#tabs-" + zones[key]);

        $("#tabs a:first").tab('show');






        }
      }

  var app = window.app || {};
  window.app = app;

  app.initCurrentActivityCharts = initCurrentActivityCharts;

});
