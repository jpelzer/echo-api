var Task = require('../task');
var IsyTask = function() {
  var self = this;
  Task.call(self, null);
  self.config = require('./.config.json');

  var ISY = require("isy");

  self.isy = new ISY({
    host: self.config.server,
    user: self.config.username,
    pass: self.config.password
  });

  // register commands
  self.register('turn ([\\w ]+)(?:lights?)? (on|off)', self.handleLightCommand);
  self.register('turn (on|off)(?: the)? ([\\w ]+)(?:lights?)?', self.handleLightCommandReverse);
  self.register('run ([\\w ]+)', self.runProgram);
};

IsyTask.prototype = Object.create(Task.prototype);
IsyTask.prototype.constructor = IsyTask;

IsyTask.prototype.runProgram = function(name) {
  var self = this;
  var programID = self.config.namesToIds[name];
  if(!programID) {
    console.log("Don't know how to run program '%s'", name);
    return;
  }
  self.isy.runIf(programID, function() {
    console.log("Ran program for %s", name)
  })
};

IsyTask.prototype.handleLightCommandReverse = function(state, name) {
  this.handleLightCommand(name, state)
};

/** Responds to 'turn (name) (lights[ignored]) (on/off) */
IsyTask.prototype.handleLightCommand = function(name, state) {
  var self = this;
  name = name.replace(/lights?/, '').trim();
  console.log("Handling command : %s, %s", name, state);

  var namesToIds = self.config.namesToIds;

  name.split('and').forEach(function(item) {
    item = item.trim();
    console.log("Turning %s %s", item, state);
    if(item in namesToIds) {
      if(state.toUpperCase() == 'ON')
        self.isy.turnOn(namesToIds[item], function(result) {
          console.log("Done, result = %s", result)
        });
      else
        self.isy.turnOff(namesToIds[item], function(result) {
          console.log("Done, result = %s", result)
        });

    }
    else
      console.log("Don't know how to handle %s", item);
  });
};

module.exports = IsyTask;
