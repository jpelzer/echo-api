var Task = require('../task');
var IsyTask = function(commandQueue) {
  var self = this;
  Task.call(self, null);
  self.config = require('./.config.json');
  self.commandQueue = commandQueue;

  var ISY = require("isy");

  self.isy = new ISY({
    host: self.config.server,
    user: self.config.username,
    pass: self.config.password
  });

  // register commands
  self.register('^turn ([\\w ]+)(?:lights?)? (on|off)', self.handleLightCommand);
  self.register('^turn (on|off)(?: the)? ([\\w ]+)(?:lights?)?', self.handleLightCommandReverse);
  self.register('^(run|runif|runthen|runelse) ([\\w ]+)', self.runProgram);
  self.register('^query (temp(erature)?|thermostats?)', self.queryTemperature);
};

IsyTask.prototype = Object.create(Task.prototype);
IsyTask.prototype.constructor = IsyTask;

IsyTask.prototype.runProgram = function(runCommand, name) {
  var self = this;
  var programID = self.config.namesToIds[name];
  if(!programID) {
    console.log("Don't know how to run program '%s'", name);
    return;
  }
  switch(runCommand) {
    case "run":
    case "runif":
      self.isy.runIf(programID, function() {
        console.log("Ran program for %s", name)
      });
      break;
    case "runthen":
      self.isy.runThen(programID, function() {
        console.log("Ran 'then' program for %s", name)
      });
      break;
    case "runelse":
      self.isy.runElse(programID, function() {
        console.log("Ran 'else' program for %s", name)
      });
      break;
  }
};

IsyTask.prototype.handleLightCommandReverse = function(state, name) {
  this.handleLightCommand(name, state)
};

IsyTask.prototype.queryTemperature = function() {
  var self = this;
  self.getHeatingNodes(function(thermostats) {
    thermostats.forEach(function(thermostat) {
      var summary = thermostat.name +
        " temp:" + thermostat.value +
        " cool:" + thermostat.coolTemp +
        " heat:" + thermostat.heatTemp +
        " mode:" + thermostat.mode;
      self.commandQueue.createTask("RESPONSE: " + summary);
    });
  });
};

IsyTask.prototype.getHeatingNodes = function(callback) {
  var self = this;
  var devices = [];
  this.config.thermostats.forEach(function(id) {
    self.isy.getDevice(id, function(err, device) {
      devices[devices.length] = device;
      if(devices.length == self.config.thermostats.length)
        callback(devices);
    });
  });
};

/** Responds to 'turn (name) (lights[ignored]) (on/off) */
IsyTask.prototype.handleLightCommand = function(name, state) {
  var self = this;
  name = name.replace(/lights?/, '').trim();
  console.log("Handling command : %s, %s", name, state);

  var namesToIds = self.config.namesToIds;

  name.replace('the', '').split('and').forEach(function(item) {
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
