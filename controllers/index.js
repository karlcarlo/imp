// controllers
var home_controller = require('./home'),
	auth_controller = require('./auth'),
	people_controller = require('./people'),
	upload_controller = require('./upload'),
	investments_controller = require('./investments');

// exports
exports.home_controller = home_controller;
exports.auth_controller = auth_controller;
exports.people_controller = people_controller;
exports.upload_controller = upload_controller;
exports.investments_controller = investments_controller;
