var restify = require('restify');

var config = require('./.config.json');
var CommandQueue = require('./api/queue');
var commandQueue = new CommandQueue();

if (config.enableEcho) {
  var Echo = require('./api/echo');
  var myEcho = new Echo(commandQueue);

  commandQueue.apis.push(myEcho);

  setInterval(function () {
    myEcho.fetchTasks();
  }, 1500);
  setInterval(function () {
    myEcho.fetchAndParseShoppingList();
  }, 5000);
}
if (config.enableIsy) {
  var IsyApi = require('./api/isy');
  commandQueue.apis.push(new IsyApi(commandQueue));
}
if (config.enableSqueeze) {
  var SqueezeApi = require('./api/squeeze');
  commandQueue.apis.push(new SqueezeApi(commandQueue));
}
if (config.enableHue) {
  var HueApi = require('./api/hue');
  commandQueue.apis.push(new HueApi());
}
if (config.enableNest) {
  var NestApi = require('./api/nest');
  commandQueue.apis.push(new NestApi());
}
if (config.enableKodi) {
  var KodiApi = require('./api/kodi');
  commandQueue.apis.push(new KodiApi(commandQueue));
}
if (config.enableIFTTT) {
  var IFTTTApi = require('./api/ifttt');
  commandQueue.apis.push(new IFTTTApi(commandQueue));
}
// Query API is always enabled
var QueryApi = require('./api/query');
commandQueue.apis.push(new QueryApi(commandQueue));

// Start up REST server
var server = restify.createServer();
server.get('/add/:secret/:name', function (req, res, next) {
  if (req.params.secret == config.secretKey) {
    commandQueue.createTask(req.params.name);
    res.send('added ' + req.params.name);
  } else {
    res.send('bad secret key: ' + req.params.secret);
  }
  next();
});
server.listen(config.listenPort, function () {
  console.log('%s listening at %s, secret key: %s', server.name, server.url, config.secretKey);
});

setInterval(function () {
  commandQueue.parseTasks();
}, 50);
