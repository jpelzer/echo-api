var Task = require('../task');

/*
 * Works to control the Kodi (XBMC) interface
 */

var KodiTask = function(echo) {
  var self = this;
  Task.call(self, null);
  this.echo = echo;
  this.config = require('./.config.json');

  var Xbmc = require('xbmc-listener');
  this.xbmc = new Xbmc({
    host: this.config.server,
    httpPort: this.config.httpPort
  });

  var codyGroup = '^(?:cody|kodi|xbmc)';
  // register commands
  self.register(codyGroup + ' say (.*)', self.say);
  self.register(codyGroup + ' pause', self.pause);
  self.register(codyGroup + ' stop', self.stop);
};

KodiTask.prototype = Object.create(Task.prototype);
KodiTask.prototype.constructor = KodiTask;

KodiTask.prototype.pause = function() {
  console.log("Doing KODI pause");
  this.xbmc.method('Player.PlayPause', {'playerid': 1});
};

KodiTask.prototype.stop = function() {
  console.log("Doing KODI stop");
  this.xbmc.method('Player.Stop', {'playerid': 1});
};

KodiTask.prototype.say = function(message) {
  this.xbmcApi.message(message);
};

module.exports = KodiTask;
