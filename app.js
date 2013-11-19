
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
//app.use(routes.auth_authenticate);
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

// Investment
app.get('/investments.:format?', routes.investments_index);
app.get('/investments/new', routes.investments_new);
app.get('/investments/:id', routes.investments_show);
app.get('/investments/:id/edit', routes.investments_edit);
app.post('/investments', routes.investments_create);
app.post('/investments/:id', routes.investments_update);
app.del('/investments/:id/delete', routes.investments_destroy);


http.createServer(app).listen(app.get('port'), function(){
  console.log("%s server listening on port %d in %s mode", config.application.name, app.get('port'), app.settings.env);
});
