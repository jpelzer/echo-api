var Task = require('../task');
var SqueezeTask = function(echo) {
  var self = this;
  Task.call(self, null);
  self.echo = echo;

  self.config = require("./.config.json");
  var SqueezeServer = require('squeezenode');
  self.squeeze = new SqueezeServer(self.config.server, self.config.port);

  //self.MAIN_PLAYER_ID = self.config.mainPlayerMAC;
  self.players = self.config.players;
  self.MAIN_PLAYER_ID = self.config.mainPlayerMAC;

  // Used to map human zero-ten over to 0-100 for the squeeze
  self.volumes = {
    mute: 0,
    zero: 0,
    one: 10,
    two: 20,
    three: 25,
    four: 32,
    five: 44,
    six: 60,
    seven: 70,
    eight: 80,
    nine: 90,
    ten: 100
  };

  // register commands
  self.register('^play$', self.play);
  self.register('(?:skip|next)(?: this)?(?: (track|song))?', self.skip);
  self.register('((un)?pause|stop)', self.pause);
  self.register('play(?: pandora)? (.+)', self.playPandora);
  self.register('set (.+) volume (?:to )?(mute|zero|one|two|three|four|five|six|seven|eight|nine|ten)', self.setVolume);
};

SqueezeTask.prototype = Object.create(Task.prototype);
SqueezeTask.prototype.constructor = SqueezeTask;

SqueezeTask.prototype.setVolume = function(location, level) {
  var self = this;
  location = location.trim();
  console.log("Setting %s volume to %s", location, level);
  self.squeeze.getPlayers(function(reply) {
    if(reply.ok) {
      var macAddress = self.players[location];
      if(!macAddress) {
        console.log("Don't know player %s, ignoring", location);
        return;
      }
      self.squeeze.players[macAddress].setVolume(self.volumes[level], function() {
        console.log("volume set")
      });
    }
  });
};

SqueezeTask.prototype.play = function() {
  var self = this;
  self.squeeze.getPlayers(function(reply) {
    if(reply.ok)
      self.squeeze.players[self.MAIN_PLAYER_ID].play(function(reply) {
        if(!reply.ok)
          console.log('Error occurred!'.red);
      });
  });
};

SqueezeTask.prototype.pause = function() {
  var self = this;
  self.squeeze.getPlayers(function(reply) {
    if(reply.ok)
      self.squeeze.players[self.MAIN_PLAYER_ID].pause(function(reply) {
        if(!reply.ok)
          console.log('Error occurred!'.red);
      });
  });
};

SqueezeTask.prototype.skip = function() {
  var self = this;
  self.squeeze.getPlayers(function(reply) {
    if(reply.ok)
      self.squeeze.players[self.MAIN_PLAYER_ID].next(function(reply) {
        if(!reply.ok)
          console.log('Error occurred!'.red);
      });
  });
};

SqueezeTask.prototype.playPandora = function(station) {
  var self = this;
  var playerId = self.MAIN_PLAYER_ID;
  self.squeeze.request(playerId, ['pandora', 'items', 0, 10], function(response) {
    if(response.ok) {
      var genreStationsId = response.result.loop_loop[0].id;
      self.squeeze.request(playerId, ['pandora', 'items', 0, 100, 'item_id:' + genreStationsId], function(response) {
          var stations = response.result.loop_loop;
          var stationRegex = new RegExp(station);
          var candidates = stations.filter(function(candidate) {
            return stationRegex.test(candidate.name.toLowerCase());
          });
          if(candidates.length > 0) {
            self.echo.createTask("RESPONSE: Playing station: " + candidates[0].name);
            self.squeeze.request(playerId, ['pandora', 'playlist', 'play', 'item_id:' + candidates[0].id], function(result) {
              console.dir(result);
            });
          }
        }
      )
    }
  })

};

module.exports = SqueezeTask;
