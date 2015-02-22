var Echo = require('./api/echo');
var myEcho = new Echo();
var config = require('./.config.json')

if(config.enableIsy) {
  var IsyApi = require('./api/isy');
  myEcho.apis.push(new IsyApi());
}
if(config.enableSqueeze) {
  var SqueezeApi = require('./api/squeeze');
  myEcho.apis.push(new SqueezeApi());
}
if(config.enableHue) {
  var SqueezeApi = require('./api/hue');
  myEcho.apis.push(new HueApi());
}
if(config.enableNest) {
  var SqueezeApi = require('./api/nest');
  myEcho.apis.push(new NestApi());
}
// Query API is generally enabled
var QueryApi = require('./api/query');
myEcho.apis.push(new QueryApi(myEcho));

setInterval(function() {
  myEcho.fetchTasks();
}, 1500);
