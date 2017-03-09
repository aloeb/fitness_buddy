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

    var closedZones = {};
    var entrydates = {};
    var capacities = {};
    var headcounts = {};
    var locationnames = {};
    var zones = {};
    var zonenames = {};
    var lastupdatedtimes = {};
    var tabcount = 0;
    var lastZoneId = "";
    var hotTab = false;

    for (var area in data2) {
      closedZones[data2[area].LocationId] = data2[area].Closed;
      lastupdatedtimes[data2[area].LocationId] = data2[area].LastUpdatedTime;
    }

    console.log(closedZones);
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

      if (headcounts[data[area].LocationId] / capacities[data[area].LocationId] >= 0.6) {
        if (!hotTab) {
          var tab = $(
            "<li><a href='#tabs-0' role='tab' data-toggle='tab'>Hot Spots</a></li>"
          );
          tab.prependTo("#tabs");
          var tabsection = $(
            "<div id='tabs-0' class='tab-pane'></div>"
          );
          tabsection.prependTo("#tab-panes");
          hotTab = true;
        }
      }
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

      var data2 = {
        labels: [
          "Occupied",
          "Available"],
          datasets: [{
            data: [headcounts[key], freeSpace],
            backgroundColor: [color]
          }]
      };

        var HTML = "<div class='chartitem col-xs-12'>";
        HTML += "<div class='row'>";
        HTML += "<a onclick='app.initTrendsCharts(\"" + key + "\");'>";
        HTML += "<h2 class='chartcaption capitalized col-xs-6'><span class='chartcaption-title'>" + locationnames[key] + "</span>";
        HTML += "<div class='chartcaption-data'>";
        if (closedZones[key] == false && headcounts[key] != '0') {
          HTML += headcounts[key];
          HTML += " / "
          HTML += capacities[key];
        }
        console.log(closedZones[key]);
        console.log(key);
        if(closedZones[key]) {
          HTML += "<span class='label label-danger'>Closed</span>";
        }
        if(headcounts[key] == '0' && closedZones[key] == false) {
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

          var el = document.getElementById("chart" + key);

          var ctx = el.getContext("2d");

          var chart = new Chart(ctx, {
              type: 'doughnut',
              data: data2,
              options: {
                cutoutPercentage: 80,
                legend: {display: false},
                tooltips: {displayColors: false}
              }
            });
            console.log(chartdata[key]);
            console.log(data);



        if (hotTab && headcounts[key] / capacities[key] >= 0.6) {
          var chartitemHot = $(
            "<div class='chartitem col-xs-12'>" +
            "<div class='row'>" +
            "<a onclick='app.initTrendsCharts(\"" + key + "\");'>" +
            "<h2 class='chartcaption capitalized col-xs-6'><span class='chartcaption-title'>" + locationnames[key] + "</span>" +
            "<div class='chartcaption-data'>" + zonenames[key] + "</div>" +
            "<div class='chartcaption-data'>" + headcounts[key] + " / " + capacities[key] + "</div>" +
            "</h2>" +
            "<div class='col-xs-6 chart'>" +
            "<canvas id='chart" + key + "-hot' width='100' height='100'></canvas>" +
            "</div>" +
            "</a>" +
            "</div>" +
            "</div>");
            chartitemHot.appendTo("#tabs-0");

            var elHot = document.getElementById("chart" + key + "-hot");

            var ctxHot = elHot.getContext("2d");
            var chartHot = new Chart(ctxHot, {
              type: 'doughnut',
              data: data2,
              options: {
                cutoutPercentage: 80,
                legend: {display: false},
                tooltips: {displayColors: false}
              }
            });
          }
        }
      }

  var app = window.app || {};
  window.app = app;

  app.initCurrentActivityCharts = initCurrentActivityCharts;

});
