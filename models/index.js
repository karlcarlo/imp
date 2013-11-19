var mongoose = require('mongoose'),
	config= require('../config');

// mongodb connect
mongoose.connect(config.database.url, function(err){
	if(err){
		console.log('connect to db error: ' + err.message);
		process.exit(1);
	}
});

// Models
require('./tag');
require('./person');
require('./investment');

// exports
exports.Tag = mongoose.model('Tag');
exports.Person = mongoose.model('Person');
exports.Investment = mongoose.model('Investment');
