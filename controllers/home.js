var config = require('../config');

var models = require('../models')
  , Investment = models.Investment;

var controllers;

var helpers = require('../helpers');


/*
 * GET home page.
 */
exports.index = function(req, res){

  var query_obj = {};

	res.render('home/index', { layout: 'layouts/home' });

};

