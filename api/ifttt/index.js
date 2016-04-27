var Task = require('../task');
var IFTTT = function(echo) {
  var self = this;
  Task.call(self, null);
  self.config = require('./.credentials');
  self.cheerio = require('cheerio');
  var request = require('request');
  self.jar = request.jar();
  self.req = request.defaults({jar: self.jar});
  self.echo = echo;
  // register commands
  self.register('^add ([\\w ]+) to shopping list', self.addToShoppingList);

};

IFTTT.prototype = Object.create(Task.prototype);
IFTTT.prototype.constructor = IFTTT;

IFTTT.prototype.fireTrigger = function(trigger, value1, callback) {
  var self = this;
  var url = 'https://maker.ifttt.com/trigger/' + trigger + '/with/key/' + self.config.makerChannelKey + '?value1=' + encodeURIComponent(value1);

  var options = {
    url: url,
    method: 'GET'
  };

  self.req(options, function(err, res, body) {
    if(!err && res.statusCode == 200) {
      callback.call(self, body, res);
    } else {
      console.log('err!');
      if(res)
        console.log(err, res.statusCode, body);
    }
  });
};

IFTTT.prototype.addToShoppingList = function(item) {
  var self = this;
  self.fireTrigger('add_to_shopping_list', item, function() {
    console.log("Called IFTTT add_to_shopping_list for '" + item + "'");
  });
};

module.exports = IFTTT;
