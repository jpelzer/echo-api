var Task = require('../task');
var QueryTask = function(echo) {
  var self = this;
  Task.call(self, null);
  self.echo = echo;

  // register commands
  self.register('^query time$', self.queryTime);
};

QueryTask.prototype = Object.create(Task.prototype);
QueryTask.prototype.constructor = QueryTask;

QueryTask.prototype.queryTime = function() {
  this.echo.createTask("RESPONSE: The time is now: " + new Date());
};


module.exports = QueryTask;
