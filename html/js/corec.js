$(function() {

  var user_token

  function initUser() {
    user_token = $.cookie("token")
    if (!user_token) {
      window.location.href = "http://localhost:8081/"
      return false
    }
    return true
  }

  //Avoid using api calls too frequently not sure what if any rate limits tehre are, we might be able to find out, caching would be best probaly
  /* 'https://www.purdue.edu/DRSFacilityUsageAPI/locations' JSON response looks like:
  [{
  	"LocationId": "b0e732b7-a89b-42e7-9465-03ba48769a62", #unique to each area
  	"LocationName": "Field 2", #also unique
  	"ZoneId": "fdbd39c0-689b-4199-b366-54a2577ef35f", #zone area belongs in, non unique - group by this
  	"ZoneName": "TREC", #goes with ZoneId above, probably unique (no way to get zones alone from API?)
  	"Capacity": 50,
  	"Active": true, #looks like inverse of closed might just be wether people are here or not
  	"Closed": false, #key off of this for hours
  	"LastUpdatedTime": "2017-02-21T23:30:41.393", #time date stamp of last update
  	"ZoneAndLocationName": null #not sure what this is, always seems to be null, ignore I guess
    },{},{}...]
  */

  function coRecHours(){
    var xhr = $.ajax({type: 'POST',
        url: 'http://localhost:8081/api/v1/corec/get_usage',
        data: JSON.stringify({ usage_type: "weeklytrends", token: user_token }),
        contentType: 'application/json',
        //contentType: 'text/plain',
        //crossDomain: true,
        success: function(data){
          dynamicAlert(data)
        }})
  }
  // Thursday	5:30AM–12AM 5:30, 0
  // Friday	5:30AM–12AM  5:30, 0
  // Saturday	8AM–12AM  8, 0
  // Sunday	10AM–12AM  10, 0
  // Monday	5:30AM–12AM  5:30, 0
  // Tuesday	5:30AM–12AM  5:30, 0
  // Wednesday	5:30AM–12AM  5:30, 0

  function dynamicAlert(){
    var alert = document.getElementById("dynamic-alert");
    if(moment().get('hour') < "12" || true){
      // <div class='alert alert-danager alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>The CoRec is closing soon!</strong> It closes at 12am.</div>
      // $('#dynamic-alert').append("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Oh snap! The CoRec is closed!</strong> It reopens tomorrow at: 5:30am</div>")
      $('#dynamic-alert').append("<div class='alert alert-success alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>The CoRec is currently open!</strong> It closes tonight at Midnight</div>")
    }
  }

  function getKeyArray(hash) {
    var keys = [];
    for(var i in hash) {
      keys = keys.concat(i);
    }
    return keys;
  }

  function getValueArray(hash) {
    var values = [];
    for(var i in hash) {
      values = values.concat(hash[i]);
    }
    return values;
  }

  function initLastUpdatedTime(locationid, el) {
    /* 'https://www.purdue.edu/DRSFacilityUsageAPI/lastupdatedtime/' JSON response looks like:
    {
    	"LocationId": "f670d7d7-c99e-4ef4-9c4f-22008753331a", #without LocationId the most recenlty updated area is returned
    	"LocationName": "Upper Track", #name
    	"ZoneId": null, #not sure why this is null...
    	"ZoneName": null, #same here it only seems null when called with lastupdatedtime...
    	"Capacity": 20,
    	"Active": false,
    	"Closed": false,
    	"LastUpdatedTime": "2017-02-21T08:56:24.14",
    	"ZoneAndLocationName": null
    }
    also available: https://www.purdue.edu/DRSFacilityUsageAPI/lastupdatedtime/{LocationId}
    */
    var data = { usage_type: "lastupdatedtime", token: user_token }
    if(typeof locationid != 'undefined') {
      data["location_id"] = locationid;
    }
    var xhr = $.ajax({type: 'POST',
        url: 'http://localhost:8081/api/v1/corec/get_usage',
        data: JSON.stringify(data),
        contentType: 'application/json',
        //contentType: 'text/plain',
        //crossDomain: true,
        success: function(data){
          viewLastUpdatedTime(data, el);
        }})
  }

  function viewLastUpdatedTime(data, el) {
    if(typeof data == 'undefined') {
      return null;
    }
    if(typeof el == 'undefined') {
      el = $("#lastupdatedtime");
    }
    var d = moment(data.LastUpdatedTime);
    el.html("Most recently updated  at " + moment(data.LastUpdatedTime).format('h:mm a'));
  }

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

    var arg1 = "currentactivity"
    var arg2 = "locations"

    var currentactivityData, locationData;
    $.when(
      $.ajax({type: 'POST',
        url: 'http://localhost:8081/api/v1/corec/get_usage',
        data: JSON.stringify({ usage_type: arg1, token: user_token }),
        contentType: 'application/json',
        //contentType: 'text/plain',
        //crossDomain: true,
        success: function(data){
          currentactivityData = data;
        }}),
      $.ajax({type: 'POST',
        url: 'http://localhost:8081/api/v1/corec/get_usage',
        data: JSON.stringify({ usage_type: arg2, token: user_token }),
        contentType: 'application/json',
        //contentType: 'text/plain',
        //crossDomain: true,
        success: function(data){
          locationData = data;
        }})
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

  function getLocationData(){
    var locationdata;
    var xhr = $.ajax({type: 'POST',
        url: 'http://localhost:8081/api/v1/corec/get_usage',
        data: JSON.stringify({ usage_type: "locations", token: user_token }),
        contentType: 'application/json',
        //contentType: 'text/plain',
        //crossDomain: true,
        success: function(data){
          return data
        }});
    return xhr;
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


      function initMonthlyTrendsChart(locationid) {
        var data = { usage_type: "monthlytrends", token: user_token}
        if(typeof locationid != 'undefined') {
          data["location_id"] = locationid
        }
        var xhr = $.ajax({type: 'POST',
          url: 'http://localhost:8081/api/v1/corec/get_usage',
          data: JSON.stringify(data),
          contentType: 'application/json',
          //contentType: 'text/plain',
          //crossDomain: true,
          success: function(data){
            viewMonthlyTrendsChart(data);
          }});
      }

      function viewMonthlyTrendsChart(data) {
        console.log(data);
        if(typeof data == 'undefined') {
          return null;
        }

        var headcounts = {};
        var capacities = {};
        var counter = 0;
        for(var stat in data) {
          console.log(stat);
          headcounts[data[stat].MonthName] = parseInt(data[stat].Headcount);
          capacities[data[stat].MonthName] = parseInt(data[stat].Capacity);
          counter++;
        }

        var chartdata = {};
        var options = {};
        var labels = getKeyArray(headcounts).reverse();
        console.log(labels);
        var datapoints = getValueArray(headcounts).reverse();
        console.log(datapoints);
        var maxCapacity = Math.max.apply(null, getValueArray(capacities));
        console.log(maxCapacity);
        var datasets = [
          {
            label: "Attendance",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            pointBorderColor: "rgba(54, 162, 235, 1)",
            pointBackgroundColor: "rgba(54, 162, 235, 1)",
            pointHoverBackgroundColor: "rgba(54, 162, 235, 1)",
            pointHoverBorderColor: "rgba(54, 162, 235, 1)",
            data: datapoints
          }
        ];

        el = document.getElementById("monthlychart");
        while (el.firstChild) {
          el.removeChild(el.firstChild);
          console.log("Remvoing Child el");
        }
        var canvas = document.createElement("canvas");
        canvas.width = el.getAttribute("width");
        canvas.height = el.getAttribute("height");
        el.appendChild(canvas);

        var ctx = canvas.getContext("2d");
        var chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            legend: {display: false},
            tooltips: {displayColors: false},
            scales: {
              yAxes: [{
                ticks: {
                  min: 0,
                  max: maxCapacity
                }
              }]
            }
          }
        });

      }

      function updateMonthlyTrendsChart(locationid) {
        var chart = document.getElementById("monthlychart");
        if(chart) {
          var containerWidth = $(chart).parent().width();
          $(chart).attr('width', containerWidth); //max width
          $(chart).attr('height', 250 ); //max height
          initMonthlyTrendsChart(locationid);
        }
      }

      function updateWeekTrendsChart(locationid) {
        /* 'https://www.purdue.edu/DRSFacilityUsageAPI/weeklytrends/ + locationID' JSON response looks like:
        This is with location upper gym
        [{
        "LocationID": "98450599-5986-4324-b1fb-d4de0412b7ed",
        "LocationName": "Upper Gym",
        "Headcount": 12,
        "EntryDate": "0001-01-01T00:00:00",
        "DayOfWeek": 6, #each day of the week
        "Hour": 23, #every hour, military time no AM or PM
        "DayName": "Saturday"
        },
        {
        "LocationID": "98450599-5986-4324-b1fb-d4de0412b7ed",
        "LocationName": "Upper Gym",
        "Headcount": 11,
        "EntryDate": "0001-01-01T00:00:00",
        "DayOfWeek": 6,
        "Hour": 22,
        "DayName": "Saturday"
        },
        {},{},{}...]

        TODO: parts of this are a little janky, averages are way off. Comments below...
        Loop over this data to build weekly chart, we should go back and ignore midnight to 6 am when the CoRec is closed. Not done currently
        EDIT: actually don't do it based on fixed times ignore the data point if the Corec or the location itself is closed. We have this data as part of the locations api
        EDIT but not historical context
        we will have to fudge this or use Mongo or something. Not doing right now.
        it apears you can call weeklytrends without a locationid but that just returns info with CoRec, that might be junk or it could be staff count or something
        ignore for now unless we find value in the data EDIT: The number seems to small to be staff since it says 6, 8, 11...not even sure what it represents so no value right now (don't use)
        */
        var data1 = {  usage_type: "weeklytrends", token: user_token }
        if(typeof locationid != 'undefined') {
          data1["location_id"] = locationid
        }

        var data2 = {  usage_type: "locations", token: user_token }
        if(typeof locationid != 'undefined') {
          data2["location_id"] = locationid
        }

        var chart = document.getElementById("weeklychart");
        if(chart) {
          var containerWidth = $(chart).parent().width();
          $(chart).attr('width', containerWidth); //max width
          $(chart).attr('height', 250 ); //max height
          var spinner = new Spinner({
            length: 5
          }).spin();
          $('#modal-body').append(spinner.el);

          var weeklyData, locationData;
          $.when(
            $.ajax({type: 'POST',
              url: 'http://localhost:8081/api/v1/corec/get_usage',
              data: JSON.stringify(data1),
              contentType: 'application/json',
              //contentType: 'text/plain',
              //crossDomain: true,
              success: function(data){
                weeklyData = data;
              }}),
            $.ajax({type: 'POST',
              url: 'http://localhost:8081/api/v1/corec/get_usage',
              data: JSON.stringify(data2),
              contentType: 'application/json',
              //contentType: 'text/plain',
              //crossDomain: true,
              success: function(data){
                locationData = data;
              }})
          ).then(function() {
            if (weeklyData && locationData) {
              viewWeekTrendsChart(weeklyData, locationData);
              spinner.stop();
            }
            else {
              // Request for web data didn't work, handle it
              console.log("Error gettting data from either: url: " + url + " or url2: " + url2);
            }
          });
        }

      }


      function initWeeklyTrendsChart(locationid, x, y, width, height) {
        var data = { usage_type: "weeklytrends", token: user_token }
        if(typeof locationid != 'undefined') {
          data["location_id"] = locationid;
        }
        var xhr = $.ajax({type: 'POST',
              url: 'http://localhost:8081/api/v1/corec/get_usage',
              data: JSON.stringify(data),
              contentType: 'application/json',
              //contentType: 'text/plain',
              //crossDomain: true,
              success: function(data){
                viewWeeklyTrendsChart(data, x, y, width, height);
              }})
        //commenting out for now, this is only real time, so have to work around it
      /*
      	TODO: get wether the location is active or closed
      	if(typeof locationid != 'undefined') {
      		url2 = "https://www.purdue.edu/DRSFacilityUsageAPI/locations/" + locationid;
      	}

      	var xhr = $.getJSON(url2).done(function(data) {
      		viewWeeklyTrendsChart(data, x, y, width, height);
      	}).fail(function(jqxhr, textStatus, error) {
      		console.log("Error: " + error);
      	});
      */
      }

      function viewWeekTrendsChart(data, locationdata) {
        console.log("RUNNING HERE");
        console.log(data);
        console.log(locationdata);
        if(typeof data == 'undefined') {
          return null;
        }
        console.log(data);
        var headcounts = [];
        for(var i = 0; i < 7; i++) {
          for(var j = 0; j < 24; j++) {
            headcounts[i * 24 + j] = 0;
          }
        }
        // console.log(headcounts);
        var time;
        for(var stat in data) {
          headcounts[parseInt(data[stat].DayOfWeek) * 24 + parseInt(data[stat].Hour)] = parseInt(data[stat].Headcount);
        }
        // console.log(hours);
        var averages = [];
        for(var k = 0; k < 7; k++){
          var total = 0;
          var count = 0;
          for(var l = 0; l < 24; l++){
            if(headcounts[k * 24 + l] != 0){
              total += headcounts[k * 24 + l];
              count++;
            }
          }
          averages[k] = Math.round(total / count);
          console.log(total);
          console.log(count);
        }
        console.log("HERE");
        console.log(averages);
        console.log("TOO FAR");
        console.log(headcounts);

        var el = document.getElementById("weeklychart");
        while (el.firstChild) {
          el.removeChild(el.firstChild);
          console.log("Remvoing Child el");
        }
        var canvas = document.createElement("canvas");
        canvas.width = el.getAttribute("width");
        canvas.height = el.getAttribute("height");
        el.appendChild(canvas);

        ctx = canvas.getContext("2d");
        chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ["S", "M", "T", "W", "Th", "F", "S"],
            datasets: [
              {
                label: "Average",
                backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)',
                  'rgba(255, 98, 205,0.2)'
                ],
                borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)',
                  'rgba(255, 98, 205,1)'
                ],
                borderWidth: 1,
                data: averages,
              }
            ]
          },
          options: {
            legend: {display: false},
            tooltips: {displayColors: false},
            scales: {
              yAxes: [{
                ticks: {
                  min: 0,
                  max: locationdata.Capacity
                }
              }]
            }
          }
        });
      }

      function viewWeeklyTrendsChart(data, x, y, width, height) {
        if(typeof data == 'undefined') {
          return null;
        }
        console.log(data);
        var valuesx = [];
        var valuesy = [];
        var headcounts = [];
        for(var i = 0; i < 7; i++) {
          for(var j = 0; j < 24; j++) {
            valuesx[i * 24 + j] = i + 1;
            valuesy[i * 24 + j] = j;
            headcounts[i * 24 + j] = 0;
          }
        }
        console.log(valuesx);
        console.log(valuesy);
        console.log(headcounts);
        var time;
        for(var stat in data) {
          headcounts[parseInt(data[stat].DayOfWeek) * 24 + parseInt(data[stat].Hour)] = parseInt(data[stat].Headcount);
          // if(parseInt(data[stat].Headcount) != 0){
          // 	if(parseInt(data[stat].Hour) > 12){
          // 		time = parseInt(data[stat].Hour) - 12 + "pm";
          // 	}
          // 	else{
          // 		time = parseInt(data[stat].Hour) + "am";
          // 	}
          // 	hours[parseInt(data[stat].DayOfWeek)][parseInt(data[stat].Hour)] = time;
          // }
        }
        // console.log(hours);
        var averages = [];
        for(var k = 0; k < 7; k++){
          var total = 0;
          var count = 0;
          for(var l = 0; l < 24; l++){
            if(headcounts[k * 24 + l] != 0){
              total += headcounts[k * 24 + l];
              count++;
            }
          }
          averages[k] = Math.round(total / count);
          console.log(total);
          console.log(count);
        }
        console.log("HERE");
        console.log(averages);
        console.log("TOO FAR");
        console.log(headcounts);

        var weekly = document.getElementById("hourlychart");
        while (weekly.firstChild) {
          weekly.removeChild(weekly.firstChild);
          console.log("Remvoing Child weekly");
        }
        // var canvas2 = document.createElement("canvas");
        // canvas2.width = weekly.getAttribute("width");
        // canvas2.height = weekly.getAttribute("height");
        // weekly.appendChild(canvas2);

        // ctx2 = canvas2.getContext("2d");
        // chart2 = new Chart(ctx2, {
        // 		type: 'bar',
        // 		data: {
        // labels: ["S", "M", "T", "W", "Th", "F", "S"],
        // datasets: [
        // 		{
        // 				label: "My First dataset",
        // 				backgroundColor: [
        // 						'rgba(255, 99, 132, 0.2)',
        // 						'rgba(54, 162, 235, 0.2)',
        // 						'rgba(255, 206, 86, 0.2)',
        // 						'rgba(75, 192, 192, 0.2)',
        // 						'rgba(153, 102, 255, 0.2)',
        // 						'rgba(255, 159, 64, 0.2)',
        // 						'rgba(255, 98, 205,0.2)'
        // 				],
        // 				borderColor: [
        // 						'rgba(255,99,132,1)',
        // 						'rgba(54, 162, 235, 1)',
        // 						'rgba(255, 206, 86, 1)',
        // 						'rgba(75, 192, 192, 1)',
        // 						'rgba(153, 102, 255, 1)',
        // 						'rgba(255, 159, 64, 1)',
        // 						'rgba(255, 98, 205,1)'
        // 				],
        // 				borderWidth: 1,
        // 				data: averages,
        // 		}
        // ]
        // },
        // 		options: {
        // 			legend: {display: false},
        // 			tooltips: {displayColors: false},
        // 			scales: {
        // 				yAxes: [{
        // 					ticks: {
        // 						min: 0,
        // 						max: 20
        // 					}
        // 				}]
        // 			}
        // 		}
        // });





        var axisxlabels = ["S", "M", "T", "W", "Th", "F", "S"];
        var axisylabels = ["Midnight", "1 am", "2 am", "3 am", "4 am", "5 am", "6 am", "7 am", "8 am", "9 am", "10 am", "11 am", "Noon", "1 pm", "2 pm", "3 pm", "4 pm", "5 pm", "6 pm", "7 pm", "8 pm", "9 pm", "10 pm", "11 pm"];

        // switch from hours ascending to descending
        axisylabels.reverse();
        var headcounts2 = [];
        for(var i = 0; i < 7; i++) {
          headcounts2 = headcounts2.concat(headcounts.slice(i * 24, (i + 1) * 24).reverse());
        }
        console.log(headcounts);
        console.log(headcounts2);

        headcounts = headcounts2;
        // for(var count in headcounts){
        // 	if(headcounts[count] == '0'){
        // 		headcounts[count] = null;
        // 	}
        // }
        console.log(headcounts);
        console.log(headcounts2);

        //use Raphael over chart.js for this, has heat chart built it
      	//demo here: http://dmitrybaranovskiy.github.io/raphael/github/dots.html
      	//possibly rebuild this with chart.js for ease of use capability but for now Raphael.js
        var paper = Raphael("hourlychart", width, height);
        var options = { heat: true, max: 10, axisxlabels: axisxlabels, axisylabels: axisylabels, axis: "1 0 1 1", axisxstep: 6, axisystep: 23 };
        dotChart = paper.dotchart(x, y, width, height, valuesx, valuesy, headcounts, options).hover(function () {
          dotChart.covers = paper.set();
          if(this.value != 0){
            dotChart.covers.push(paper.tag(this.x, this.y, this.value , 0, this.r + 2).insertBefore(this));
          }
        }, function () {
          dotChart.covers.remove();
        });
      }

      function updateWeeklyTrendsChart(locationid) {
        var chart = $("#hourlychart").first();
        if(chart) {
          chart.empty();
          var x = 10;
          var y = 0;
          $("#hourlychart svg").first().attr("width", 348);
          $("#hourlychart svg").first().attr("height", 487.2);
          initWeeklyTrendsChart(locationid, x, y, 348, 487.2);
        }
      }

      function initTrendsCharts(locationid) {
        app.trendsChartsActive = true;
        app.trendsChartsLocationID = locationid;
        $('#trends').css('display', 'block');
        updateTrendsCharts(locationid);
        $('#trends').modal();
      }

      function updateTrendsCharts(locationid) {
        /* 'https://www.purdue.edu/DRSFacilityUsageAPI/locations' JSON response looks like:
      	[{
      		"LocationId": "b0e732b7-a89b-42e7-9465-03ba48769a62", #unique to each area
      		"LocationName": "Field 2", #also unique
      		"ZoneId": "fdbd39c0-689b-4199-b366-54a2577ef35f", #zone area belongs in, non unique - group by this
      		"ZoneName": "TREC", #goes with ZoneId above, probably unique (no way to get zones alone from API?)
      		"Capacity": 50,
      		"Active": true, #looks like inverse of closed might just be wether people are here or not
      		"Closed": false, #key off of this for hours
      		"LastUpdatedTime": "2017-02-21T23:30:41.393", #time date stamp of last update
      		"ZoneAndLocationName": null #not sure what this is, always seems to be null, ignore I guess
      	  }]
      	 */
        if(app.trendsChartsActive) {
          var data = { usage_type: "locations", token: user_token }
          if(typeof locationid != 'undefined') {
            data["location_id"] = locationid
          }
          var xhr = $.ajax({type: 'POST',
            url: 'http://localhost:8081/api/v1/corec/get_usage',
            data: JSON.stringify(data),
            contentType: 'application/json',
            //contentType: 'text/plain',
            //crossDomain: true,
            success: function(data){
              $("#locationname").html(data.LocationName);
            }})

          updateMonthlyTrendsChart(locationid);
          updateWeeklyTrendsChart(locationid);
          updateWeekTrendsChart(locationid);
          initLastUpdatedTime(locationid, $("#lastupdatedtimetrends"));
        }
      }

      $('#trends').on('hide.bs.modal', function () {
        app.trendsChartsActive = false;
        app.trendsChartsLocationID = "";
      });


      var app = window.app || {};
      window.app = app;

      app.trendsChartsActive = false;
      app.trendsChartsLocationID = "";
      app.initUser = initUser;
      app.initLastUpdatedTime = initLastUpdatedTime;
      app.initCurrentActivityCharts = initCurrentActivityCharts;
      app.initTrendsCharts = initTrendsCharts;
      app.updateTrendsCharts = updateTrendsCharts;
      app.resizeHandler = resizeHandler;
      app.dynamicAlert = dynamicAlert;

    });
