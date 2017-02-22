var https = require('https')

var corec = new Object()

corec.get_current_usage = function(cb) {
	https.get('https://www.purdue.edu/DRSFacilityUsageAPI/currentactivity',
		(res) => {
			res.setEncoding('utf8');
			res.on('data', function (data) {
			    cb(JSON.parse(data)); // I can't parse it because, it's a string. why?
			});
		});
}

module.exports = corec