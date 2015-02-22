var Task = require('../task');
var SqueezeTask = function() {
  var self = this;
  Task.call(self, null);

  self.config = require("./.config.json");
  var SqueezeServer = require('squeezenode');
  self.squeeze = new SqueezeServer(self.config.server, self.config.port);

  self.MAIN_PLAYER_ID = self.config.mainPlayerMAC;

  // register commands
  self.register('^play$', self.play);
  self.register('(?:skip|next)(?: this)?(?: (track|song))?', self.skip);
  self.register('((un)?pause|stop)', self.pause);
  self.register('play(?: pandora)? (.+)', self.playPandora);
};

SqueezeTask.prototype = Object.create(Task.prototype);
SqueezeTask.prototype.constructor = SqueezeTask;

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
            //console.log("Found %s %s", candidates[0].id, candidates[0].name);
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
