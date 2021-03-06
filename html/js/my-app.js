// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var view1 = myApp.addView('#view-1', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});
var view2 = myApp.addView('#view-2', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});
var view6 = myApp.addView('#view-6', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});
var view4 = myApp.addView('#view-4', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});
// var view9 = myApp.addView('#view-9', {
//     // Because we use fixed-through navbar we can enable dynamic navbar
//     dynamicNavbar: true
// });

myApp.onPageInit('login', function(page){
//your code for init charts should be there
	console.log("I'm here");
    // var randomScalingFactor = function(){ return Math.round(Math.random()*100)};
    // var lineChartData = {
    //     labels : ["January","February","March","April","May","June","July"],
    //     datasets : [
    //         {
    //             label: "My First dataset",
    //             fillColor : "rgba(220,220,220,0.2)",
    //             strokeColor : "rgba(220,220,220,1)",
    //             pointColor : "rgba(220,220,220,1)",
    //             pointStrokeColor : "#fff",
    //             pointHighlightFill : "#fff",
    //             pointHighlightStroke : "rgba(220,220,220,1)",
    //             data : [randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor()]
    //         },
    //         {
    //             label: "My Second dataset",
    //             fillColor : "rgba(151,187,205,0.2)",
    //             strokeColor : "rgba(151,187,205,1)",
    //             pointColor : "rgba(151,187,205,1)",
    //             pointStrokeColor : "#fff",
    //             pointHighlightFill : "#fff",
    //             pointHighlightStroke : "rgba(151,187,205,1)",
    //             data : [randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor()]
    //         }
    //     ]
    // }
    //
    // var ctx = document.getElementById("myChart");
    // window.myLine = new Chart(ctx).Line(lineChartData, {
    //     responsive: true
    // });
});
angular.module('myApp', ['ngCookies', 'mwl.calendar', 'ui.bootstrap', 'ngAnimate', 'angularMoment', 'markau.timer'])
    .config(['$locationProvider', function($locationProvider) {
        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        });
    }])
    .config(['calendarConfig', function(calendarConfig) {

        // View all available config
        console.log(calendarConfig);

        // Change the month view template globally to a custom template
        // calendarConfig.templates.calendarMonthView = 'path/to/custom/template.html';

        // Use either moment or angular to format dates on the calendar. Default angular. Setting this will override any date formats you have already set.
        calendarConfig.dateFormatter = 'moment';

        // This will configure times on the day view to display in 24 hour format rather than the default of 12 hour
        calendarConfig.allDateFormats.moment.date.hour = 'HH:mm';

        // This will configure the day view title to be shorter
        calendarConfig.allDateFormats.moment.title.day = 'ABC ddd D MMM';

        // This will set the week number hover label on the month view
        calendarConfig.i18nStrings.weekNumber = 'Week {week}';

        // This will display all events on a month view even if they're not in the current month. Default false.
        calendarConfig.displayAllMonthEvents = true;

        // Make the week view more like the day view, ***with the caveat that event end times are ignored***.
        calendarConfig.showTimesOnWeekView = true;

      }])
    .controller('MainController', [
        '$scope',
        '$cookies',
        '$location',
        '$http',
        'moment',
        'calendarConfig',
        function($scope, $cookies, $location, $http, moment, alert, calendarConfig) {
          var vm = this;
          // $http.get('http://httpbin.org/ip').then(function(){console.log("success")}, function(){console.log("error")});
          console.log(calendarConfig);
          //These variables MUST be set as a minimum for the calendar to work
          $scope.viewDate = new Date();
          $scope.calendarView = 'week';
          $scope.time = 300;
          $scope.status = 'notstarted';
          var actions = [{
                label: '<i class=\'glyphicon glyphicon-pencil\'></i>',
                onClick: function(args) {
                  alert.show('Edited', args.calendarEvent);
                }
              }, {
                label: '<i class=\'glyphicon glyphicon-remove\'></i>',
                onClick: function(args) {
                  alert.show('Deleted', args.calendarEvent);
                }
              }];
              // console.log(moment().startOf('week').add(1, 'week').add(9, 'hours').toDate());
              $scope.events = [];
              $scope.workout = {};
              $scope.workout.name = "";
              $scope.workout.start = "2017-04-26T18:00";
              $scope.workout.end = "2017-04-26T19:00";

              $scope.cellIsOpen = true;

              $scope.addEvent = function() {
                $scope.events.push({
                  title: 'New event',
                  startsAt: moment().startOf('day').toDate(),
                  endsAt: moment().endOf('day').toDate(),
                  color: calendarConfig.colorTypes.important,
                  draggable: true,
                  resizable: true
                });
              };

              $scope.eventClicked = function(event) {
                if (event.type == 'suggestion') {
                  console.log("hello world")
                  $scope.workout.start = event.startsAt
                  $scope.workout.end = event.endsAt
                } else {
                  alert.show('Clicked', event);
                }
              };

              $scope.eventEdited = function(event) {
                alert.show('Edited', event);
              };

              $scope.eventDeleted = function(event) {
                alert.show('Deleted', event);
              };

              $scope.eventTimesChanged = function(event) {
                alert.show('Dropped or resized', event);
              };

              $scope.toggle = function($event, field, event) {
                $event.preventDefault();
                $event.stopPropagation();
                event[field] = !event[field];
              };

              $scope.timespanClicked = function(date, cell) {

                if ($scope.calendarView === 'month') {
                  if (($scope.cellIsOpen && moment(date).startOf('day').isSame(moment($scope.viewDate).startOf('day'))) || cell.events.length === 0 || !cell.inMonth) {
                    $scope.cellIsOpen = false;
                  } else {
                    $scope.cellIsOpen = true;
                    $scope.viewDate = date;
                  }
                } else if ($scope.calendarView === 'year') {
                  if (($scope.cellIsOpen && moment(date).startOf('month').isSame(moment($scope.viewDate).startOf('month'))) || cell.events.length === 0) {
                    $scope.cellIsOpen = false;
                  } else {
                    $scope.cellIsOpen = true;
                    $scope.viewDate = date;
                  }
                }
              }

          console.log(vm);
            var token = $cookies.get('token')
            if (!token) {
                var searchObject = $location.search()
                if (searchObject.token) {
                    $cookies.put('token', searchObject.token)
                    token = searchObject.token
                }
            }
            $scope.token = token
            console.log(token);
            today = new Date(Date.now())
            next_week = new Date(Date.now() + (1000*60*60*24*7))
            $http.post('http://localhost:8081/api/v1/users/get_calendar', {"token": token, "start_time": today, "end_time": next_week}).then(function(data){
              $scope.googleCalendar = data;
              console.log(data)
              data.data.events.forEach((event) => {
                $scope.events.push({
                  title: event.summary,
                  endsAt: new Date(Date.parse(event.end.dateTime)),
                  startsAt: new Date(Date.parse(event.start.dateTime)),
                  color: { // can also be calendarConfig.colorTypes.warning for shortcuts to the deprecated event types
                    primary: '#686868', // the primary event color (should be darker than secondary)
                    secondary: '#d1e8ff' // the secondary event color (should be lighter than primary)
                  },
                  draggable: true,
                  resizable: true,
                  actions: actions
                })
              })
            }, function(){
              console.log("error")
            });
            later_today = new Date(Date.now())
            later_today.setHours(24,0,0,0)
            $http.post('http://localhost:8081/api/v1/users/get_rec_workout_times', {"token": token, "start_time": today, "end_time": later_today}).then(function(data){
              $scope.googleCalendar = data;
              console.log(data);
              data.data.suggestions.forEach((time) => {
                $scope.events.push({
                  title: "Possible workout time!",
                  startsAt: new Date(Date.parse(time)),
                  endsAt: new Date(Date.parse(time)+(1000*60*90)),
                  color: { // can also be calendarConfig.colorTypes.warning for shortcuts to the deprecated event types
                    primary: '#686868', // the primary event color (should be darker than secondary)
                    secondary: '#e2a1a1' // the secondary event color (should be lighter than primary)
                  },
                  draggable: true,
                  resizable: true,
                  type: 'suggestion'
                })
              })
            }, function(){
              console.log("error")
            });
            $http.post('http://localhost:8081/api/v1/users/get_user', {"token": token}).then(function(data){$scope.username = data.data.name; $scope.userdata = data.data; console.log(data); console.log(data.data.name);}, function(){console.log("error")});
            $http.post('http://localhost:8081/api/v1/users/get_workouts', {"token": token}).then(function(data){$scope.workouts = data.data; console.log(data);}, function(){console.log("error")});

            $scope.login = function() {
                window.location.href = "http://localhost:8081/api/v1/auth/facebook";
            }
            $scope.logout = function() {
                $cookies.remove('token')
                window.location.href = "http://localhost:8081/";
            }
            $scope.logged_in = function() {
                return (typeof $scope.token != 'undefined')
            }
            $scope.import_cal = function() {
                window.location.href = "http://localhost:8081/api/v1/users/auth_google?state=" + $scope.token
            }

            $scope.get_rec_workouts = function() {
                console.log("yo")
                $http.post('http://localhost:8081/api/v1/users/get_routines', {"token": token, "filters": { "tags": ['legs', 'core'] }}).then(function(data){
                  console.log(data.data[0]._id)
                  $scope.workout.name = data.data[0]._id
                }, function(){
                  console.log("error")
                });
              }

              $scope.workoutSubmit = function(){
                console.log($scope.workout.start);
                $http.post('http://localhost:8081/api/v1/users/schedule_workout', {"token": token, "date": $scope.workout.start, "workout": $scope.workout.name}).then(function(data){
                  console.log(data)
                }, function(){
                  console.log("error")
                });
              }

              $scope.get_rec_workouts()
            // console.log($username);
            // console.log($password);
        }
    ]);

// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="schedule.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
	return;
};
