/*
 * This class handles internal request dispatching, and is the core message transport for the app. It replaces
 * the legacy 'echo' class, which was Amazon-specific.
 */

var CommandQueue = function () {
  var self = this;
  self.apis = [];
  self.tasks = [];
  self.dirty = false;
};

CommandQueue.prototype.parseTasks = function () {
  var self = this;
  if (self.tasks.length > 0 && self.dirty) {
    console.log('Parsing %d tasks.', self.tasks.length);
    for(var i in self.tasks){
      console.log(' task[%d]: %s', i, self.tasks[i].text);
    }
  }

  var tasks = self.tasks
  for (i in self.apis) {
    var api = self.apis[i];
    for (var j in tasks) {
      var task = tasks[j];
      tasks[j] = api.parse(task);
    }
  }

  self.cleanupTasks(tasks);
};

CommandQueue.prototype.cleanupTasks = function (parsedTasks) {
  var self = this;
  self.tasks = parsedTasks.filter(function (task) {
    if (task.executed) {
      console.log('Deleting: %s', task.text);
      return false;
    }
    return true;
  });
  self.dirty = false;
};

/** Creates a task objectc and enqueues it for later parsing. */
CommandQueue.prototype.createTask = function (taskText) {
  console.log("Creating: %s", taskText);
  var self = this;
  var task = {
    createdDate: new Date().getTime(),
    text: taskText};
  self.tasks.push(task);
  self.dirty = true;
};


module.exports = CommandQueue;
