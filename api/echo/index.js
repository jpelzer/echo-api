var Echo = function (commandQueue) {
  var self = this;
  var queue = commandQueue;
  self.config = require('./.credentials');
  self.cheerio = require('cheerio');
  self.csrf = null;
  self.mainAccountId = null;
  self.lastRun = 0;

  var request = require('request');
  self.jar = request.jar();
  self.req = request.defaults({jar: self.jar});

  self.domain = 'https://pitangui.amazon.com';
  self.tasksToFetch = 100;
  self.apis = [];
  self.tasks = [];
};

Echo.prototype.request = function (api, method, params, data, callback) {
  var self = this;
  var url = '';
  url += self.domain;
  url += '/api/' + api;

  var headers = {
    'User-Agent': 'User Agent/0.0.1'
  };

  var options = {
    url: url,
    method: method,
    headers: headers,
    qs: params
  };

  if (data) {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Origin'] = 'http://echo.amazon.com';
    options.headers['Referer'] = 'http://echo.amazon.com/spa/index.html';
    if (self.csrf == null) {
      // Try to find csrf in the cookie jar
      var cookies = self.jar.getCookies("http://amazon.com/");
      for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].key == 'csrf')
          self.csrf = cookies[i].value;
      }
    }
    if (self.csrf != null) {
      options.headers['csrf'] = self.csrf;
    }
  }

  self.req(options, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      callback.call(self, body, res);
    } else {
      console.log('err!');
      if (res)
        console.log(err, res.statusCode, body);
    }
  });
};

Echo.prototype.get = function (api, params, callback) {
  var self = this;
  self.request(api, 'GET', params, null, callback);
};

Echo.prototype.put = function (api, params, data, callback) {
  var self = this;
  self.request(api, 'PUT', params, data, callback);
};

/** Takes the body from the HTML response to an API call and parses out the openid bs */
Echo.prototype.doLogin = function (apiBody) {
  var self = this;
  self.csrf = null;

  var $ = self.cheerio.load(apiBody);

  var signInForm = $('#ap_signin_form');

  var qs = {};

  signInForm.find('input').each(function (index, input) {
    var name = input.attribs.name;
    var value = input.attribs.value;
    if (name != null && name.indexOf('openid') > -1) {
      value = new Buffer(value.replace('ape:', ''), 'base64');
      qs[name] = value;
    }
  });

  self.req.get({
    url: "https://www.amazon.com/ap/signin",
    qs: qs,
    jar: self.jar
  }, function (err, loginRequest, body) {
    console.log("Handling login...");
    $ = self.cheerio.load(body);

    var signInForm = $('#ap_signin_form');

    // Set up the form inputs, pulling in hidden elements and overlaying login info
    var form = {};
    signInForm.find('input').each(function (index, input) {
      form[input.attribs.name] = input.attribs.value;
    });
    form['email'] = self.config.email;
    form['password'] = self.config.password;
    form['create'] = "0";

    var submitURL = signInForm.attr('action');
    var headers = {
      Referer: submitURL
    };
    if (self.csrf != null)
      headers['csrf'] = self.csrf;

    self.req.post({
      url: submitURL,
      form: form,
      headers: headers,
      jar: self.jar
    }, function (err, httpResponse, body) {
      // And here we are, login complete. We expect to have a 302 response here, but we'll ignore it.
      console.log("Login complete. Getting main user id");
      self.request('household', 'GET', {}, {}, function (body) {
        if (body.indexOf('<html>') > -1) {
          console.log("Login failed, response: %s", body);
//          return;
        }
        var response = JSON.parse(body);
        self.mainAccountId = response.accounts[0].id;
        console.log("Main account id: %s", self.mainAccountId);
      });
    });
  });
};

Echo.prototype.createTask = function (text) {
  var self = this;
  console.log("Creating task '%s'", text);
  var data = {
    complete: false,
    createdDate: new Date().getTime(),
    deleted: false,
    itemId: null,
    lastLocalUpdatedDate: null,
    lastUpdatedDate: null,
    nbestItems: null,
    text: text,
    type: "TASK",
    utteranceId: null,
    version: null
  };
  self.request('todos', 'POST', {}, data, function (body, response) {
    console.log("Created task '%s'", text);
  })
};

Echo.prototype.fetchAndParseShoppingList = function () {
  var self = this;
  self.get('todos', {
    type: 'SHOPPING_ITEM',
    size: self.tasksToFetch
  }, function (body, response) {
    if (body.indexOf('<html>') > -1) {
      // The API is returning an HTML login page, let fetchTasks handle login.
      return;
    }
    var json = JSON.parse(body);
    var tasks = json.values;

    if (tasks.length > 0)
      console.log('%d shopping list entries found.', tasks.length);

    for (var j in tasks) {
      var task = tasks[j];
      self.createTask("add " + task.text + " to shopping list");
      task.executed = true;
    }
    self.cleanupTasks(tasks);
  });
};

Echo.prototype.fetchTasks = function () {
  var self = this;
  self.busy = true;
  self.get('todos', {
    type: 'TASK',
    size: self.tasksToFetch
  }, function (body, response) {
    if (body.indexOf('<html>') > -1) {
      // The API is returning an HTML login page, we should handle login now.
      self.doLogin(body);
      return;
    }
    var json = JSON.parse(body);
    var tasks = json.values;

    var oldStr = JSON.stringify(self.tasks);
    var newStr = JSON.stringify(tasks);

    if (oldStr != newStr || self.lastRun + 60000 < new Date().getTime()) {
      self.tasks = tasks;
      self.lastRun = new Date().getTime();
      self.parseTasks();
    }
  });
};

Echo.prototype.parseTasks = function () {
  var self = this;
  if (self.tasks.length > 0)
    console.log('%d tasks found.', self.tasks.length);

  // TODO: fix this super inefficient code.
  var tasks = self.tasks;
  for (var i in self.apis) {
    var api = self.apis[i];
    for (var j in tasks) {
      var task = tasks[j];
      tasks[j] = api.parse(task);
    }
  }

  self.cleanupTasks(tasks);
};

Echo.prototype.cleanupTasks = function (tasks) {
  var self = this;

  var cleanup = tasks.filter(function (task) {
    return task.executed;
  });

  for (var i in cleanup) {
    var task = cleanup[i];
    task.deleted = true;
    delete task.executed;
    console.log('Deleting: %s', task.text);
    self.put('todos/' + task.itemId, null, task, function (res) {
      // TODO maybe put something here
    });
  }
};

module.exports = Echo;
