var Echo = require('./api/echo');
var myEcho = new Echo();
var config = require('./.config.json')

if(config.enableIsy) {
  var IsyApi = require('./api/isy');
  myEcho.apis.push(new IsyApi(myEcho));
}
if(config.enableSqueeze) {
  var SqueezeApi = require('./api/squeeze');
  myEcho.apis.push(new SqueezeApi(myEcho));
}
if(config.enableHue) {
  var HueApi = require('./api/hue');
  myEcho.apis.push(new HueApi());
}
if(config.enableNest) {
  var NestApi = require('./api/nest');
  myEcho.apis.push(new NestApi());
}
if(config.enableKodi) {
  var KodiApi = require('./api/kodi');
  myEcho.apis.push(new KodiApi(myEcho));
}
// Query API is generally enabled
var QueryApi = require('./api/query');
myEcho.apis.push(new QueryApi(myEcho));

setInterval(function() {
  myEcho.fetchTasks();
}, 1500);
