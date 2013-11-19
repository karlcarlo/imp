var controllers = require('../controllers')
  , home_controller = controllers.home_controller
  // , auth_controller = controllers.auth_controller
  // , people_controller = controllers.people_controller
  // , upload_controller = controllers.upload_controller
  , investments_controller = controllers.investments_controller

// home
exports.index = home_controller.index;
// exports.notify = function(req, res, next){
//   res.render('home/notify', { layout: 'layouts/blank' });
// };


// // auth
// exports.auth_signin = auth_controller.signin;
// exports.auth_signout = auth_controller.signout;
// exports.auth_signup = auth_controller.signup;

// exports.auth_authenticate = auth_controller.authenticate;

// // people
// exports.people_index = people_controller.index;
// exports.people_profile = people_controller.profile;
// exports.people_set = people_controller.set;
// exports.people_set_password = people_controller.set_password;
// exports.people_destroy = people_controller.destroy;
// exports.people_set_active = people_controller.set_active;

// // upload
// exports.upload = upload_controller.upload;

// // asset
// exports.assets_index = assets_controller.index;
// exports.assets_destroy = assets_controller.destroy;

// investments
exports.investments_index = investments_controller.index;
exports.investments_show = investments_controller.show;
exports.investments_new = investments_controller.new;
exports.investments_create = investments_controller.create;
exports.investments_edit = investments_controller.edit;
exports.investments_update = investments_controller.update;
exports.investments_destroy = investments_controller.destroy;
