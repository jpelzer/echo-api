var Task = require('../task');

/*
* This class is pretty specific to my own setup, with queries and responses that basically map human-friendly requests
* (unlock the front door) to less friendly requests (turn on front door unlock request). This class literally grabs
* requests and then creates new requests that the other modules in the system use to do real work.
*/

var QueryTask = function(commandQueue) {
  var self = this;
  Task.call(self, null);
  self.commandQueue = commandQueue;

  // register commands
  self.register('^query time$', self.queryTime);
  self.register('^unlock(?: the)? front door$', self.unlockFrontDoor);
  self.register('^(open|close) (?:the )?garage(?: doors?)?', self.garageDoor);
  self.register('^set volume (?:to )?(mute|zero|one|two|three|four|five|six|seven|eight|nine|ten)', self.setVolume);
  self.register('^set temp(?:erature)? (?:to )?(home|away|vacation)(?: mode)?', self.setTemperature);
  self.register('^start (?:my )?(.*)', self.startMy);
};

QueryTask.prototype = Object.create(Task.prototype);
QueryTask.prototype.constructor = QueryTask;

QueryTask.prototype.startMy = function(whatToStart) {
  switch(whatToStart) {
    case 'morning':
      this.commandQueue.createTask("set volume to two");
      this.commandQueue.createTask("set bedroom volume to mute");
      this.commandQueue.createTask("turn on kitchen and dining room lights");
      this.commandQueue.createTask("play classical radio");
      this.commandQueue.createTask("RESPONSE: Started morning mode.");
      break;
    case 'work':
      this.commandQueue.createTask("turn off kitchen and dining room and living room lights");
      this.commandQueue.createTask("RESPONSE: Started work mode. Have a good day!");
      break;
    default:
      this.commandQueue.createTask("RESPONSE: Don't know how to start " + whatToStart + " mode.");
  }
};

QueryTask.prototype.setTemperature = function(mode) {
  this.commandQueue.createTask("runthen set temp " + mode);
  this.commandQueue.createTask("RESPONSE: Setting temperature to " + mode + " mode.");
};

QueryTask.prototype.setVolume = function(level) {
  this.commandQueue.createTask("set living room volume to " + level);
  this.commandQueue.createTask("set kitchen volume to " + level);
  this.commandQueue.createTask("set bathroom volume to " + level);
};

QueryTask.prototype.garageDoor = function(openClose) {
  this.commandQueue.createTask("run " + openClose + " garage door");
  if(openClose == "open")
    this.commandQueue.createTask("RESPONSE: Opening garage door.");
  else
    this.commandQueue.createTask("RESPONSE: Closing garage door.");
};

QueryTask.prototype.unlockFrontDoor = function() {
  this.commandQueue.createTask("turn on front door unlock request");
  this.commandQueue.createTask("RESPONSE: Initiated door unlock sequence.");
};

QueryTask.prototype.queryTime = function() {
  this.commandQueue.createTask("RESPONSE: The time is now: " + new Date());
};


module.exports = QueryTask;
