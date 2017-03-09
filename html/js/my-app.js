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
angular.module('myApp', ['ngCookies'])
    .config(['$locationProvider', function($locationProvider) {
        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        });
    }])
    .controller('MainController', [
        '$scope',
        '$cookies',
        '$location',
        function($scope, $cookies, $location) {
            var token = $cookies.get('token')
            if (!token) {
                var searchObject = $location.search()
                if (searchObject.token) {
                    $cookies.put('token', searchObject.token)
                    token = searchObject.token
                }
            }
            $scope.token = token
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
