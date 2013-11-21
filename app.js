
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	fs = require('fs'),
	access_log = fs.createWriteStream('./logs/access.log', { flags: 'a' }),
	error_log = fs.createWriteStream('./logs/error.log', { flags: 'a' });

var config = require('./config')

var helpers = require('./helpers');

var app = express();

// all environments
app.set('port', process.env.PORT || config.application.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ uploadDir: './tmp' }));
app.use(express.methodOverride());
app.use(express.cookieParser(config.session.secret));
app.use(express.session({ secret: config.session.secret }));
app.use(routes.auth_authenticate);
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.locals({
  title: config.application.title,
  version: config.application.version,
  messages: []
})

// Routes
app.get('/', routes.index);
app.get('/notify', routes.notify);

// Auth
app.get('/signin', routes.auth_signin);
app.get('/signout', routes.auth_signout);
app.get('/signup', routes.auth_signup);
app.post('/signin', routes.auth_signin);
app.post('/signup', routes.auth_signup);

// Person
app.get('/people.:format?', routes.people_index);
app.get('/profile', routes.people_profile);
app.get('/set', routes.people_set);
app.post('/set', routes.people_set);
app.get('/set_password', routes.people_set_password);
app.post('/set_password', routes.people_set_password);
app.del('/people/:id/delete', routes.people_destroy);
app.put('/people/:id/set_active', routes.people_set_active);

// Upload
app.post('/upload', routes.upload);

// // Asset
// app.get('/assets.:format?', routes.assets_index);
// app.del('/assets/:id/delete', routes.assets_destroy);

// Investment
app.get('/investments.:format?', routes.investments_index);
app.get('/investments/list', routes.investments_list);
app.get('/investments/new', routes.investments_new);
app.get('/investments/:id.:format?', routes.investments_show);
app.get('/investments/:id/edit', routes.investments_edit);
app.post('/investments', routes.investments_create);
app.post('/investments/:id', routes.investments_update);
app.del('/investments/:id/delete', routes.investments_destroy);


http.createServer(app).listen(app.get('port'), function(){
  console.log("%s server listening on port %d in %s mode", config.application.name, app.get('port'), app.settings.env);
});
