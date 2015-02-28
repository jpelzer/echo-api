var Task = function(prefix) {
  var self = this;
  self.prefix = prefix;
  self.commands = [];
};

Task.prototype.register = function(phrase, callback) {
  var self = this;
  // combines the prefix with a regex to find matches in the todo
  // list
  if(self.prefix)
    phrase = self.prefix + ' ' + phrase;

  var regex = new RegExp(phrase);
  self.commands.push({
    regex: regex,
    callback: callback
  });
};

Task.prototype.parse = function(task) {
  var self = this;
  var string = task.text.toLowerCase();
  // filter on matches
  var matches = self.commands.filter(function(command) {
    return command.regex.test(string);
  });

  if(matches.length != 1) {
    // No match... Check to see if it should be expired
    if(task.text.indexOf("RESPONSE:") == 0 && task.createdDate + (90 * 1000) < new Date().getTime())
      task.executed = true;
    return task;
  }

  var command = matches[0];
  var results = command.regex.exec(string);
  // there is almost definitely a better way to do this.
  var params = results[1];
  console.log('Executing: %s', string);
  if(results.length > 1)
    command.callback.apply(this, results.slice(1));
  else
    command.callback.call(this, params);
  task.executed = true;
  return task;
};

module.exports = Task;
