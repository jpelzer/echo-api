# amazon-echo-api

I [forked][github-jpelzer] this code off the work of Glen Balliet's [echo-api][github-source], which included support 
for Nest and Hue, neither of which I own. This is my first Node.js project, so I followed the pattern that Glen had set 
down in his code and I added support for [Universal Device's ISY-99i][isy99i] (for Insteon lighting and thermostat 
control) and for control of [Logitech Media Server][lms] (for Squeezebox home audio control).

I also added support for direct login to the Amazon API, instead of doing a manual login and then manually copying the
resulting cookies... This turned out to be the goofiest part of the project, but I think it's going to end up making
this a lot more resilient in the end. The internal working of the Task object has been tweaked to allow regex-based 
matches, instead of just keywords, so a task can be registered for both "(this) should be (that)" and "do (that) to 
(this)" using the same task. 

This is (almost, kind of) an API for Amazon Echo. [Video Demonstration][youtube]

**This code is not for the faint of heart.** Glen wrote it in about three
hours, the day after he got his Echo, and there are a lot of
improvements to be made. The original goal was just a
proof-of-concept, to see if he could make Echo do what he wanted. His
goal with releasing the source was to help out other like-minded Echo
owners (Thanks Glen!).

## Prerequisites

- **Wolfram Alpha API Key:** this is used for converting the
  plain-text numbers that Echo records (e.g., "seventy three") into
  integers that can be used to set the temperature. Maybe there's
  another Node package out there to do this, but this seemed like the
  easiest way to get it working. [Get a key here.][wolfram] (Only needed
  if you use temperature controls in ISY or Nest)
- **Username for your Hue:** if you're not messing with Hue, then
  don't worry about it. This was pretty easy to do in the Node REPL by
  loading [node-hue-api][hue-api] and just typing in the
  commands. Later versions of this app should generate a new username
  (assuming it doesn't have one saved) and save it for use later.

## Amazon Echo Credentials

These should be added to api/echo/.credentials.json (create the file). You can use api/echo/.credentials.EXAMPLE.json as
a template.

## Other Credentials

Other credentials are located in each sub folder, either named .credentials.json or .config.json. 

### Nest credentials 
These are the same ones you use to log in to the app, 

### Hue Credentials 
The username for Hue is explained above (in "Prerequisites").

### ISY Configuration
The ISY needs an IP for your ISY server, a username and password, and a map of keywords to addresses. The addresses are 
either numeric (for scenes) or hexidecimal separated by spaces (for individual devices). You can find them by hitting 
the ISY API directly. 

### Squeezebox Configuration
The Squeezebox (ie Logitech Media Server) support needs an http://<ip> and port for the LMS, as well as the MAC address
of one of your actual players. I haven't tested, but I'm going to make an assumption that this code will NOT work with 
mysqueezebox.com systems, you have to be running a local server. The player MAC address is how all the squeezeboxes 
identify themselves, and it is a six byte hexidecimal string. You can find it if you go to the 'Settings' page on LMS, 
go to the 'Player' tab, and then go to 'Basic Settings' for one of your players. It will be listed in the summary, as 
"Player MAC Address: 00:00:00:00:00:00". 

If you have a number of players synchronized, it doesn't matter which player you choose, if you tell it to play something,
all the players will play it.

I may make life easier at some point and do it by name, especially if I make it possible to set voluem for a particular 
player.

## Running the App

This is a Node app, so (after adding the required credentials) running
the app is really just two steps:

1. Run `npm install` to install required packages.
1. Run `node app` to run the app.

### Using ISY-99i
The ISY currently responds to either "turn on/off (keyword) light(s)" OR "turn (keyword) light(s) 
on/off", but I recommend the former, as the Echo tends to ignore the trailing 'off' in the latter when creating todos.

### Using Squeezebox (Logitech Media Server)
* play : Issues a play/pause command
* (next|skip) (this) (track|song) : Skips the current track ('remind me to skip this track' or 'remind me to next' both work)
* ((un)pause|stop) : issues a pause toggle (I know this is not especially intuitive. There wasn't a 'stop' command available.)
* play (pandora) (station name) : My favorite feature so far. Gets the list of your Pandora stations and plays the first 
one that matches your query (exact lowercase match). So if you have 'Classical Radio' and 'Classical Christmas Radio', you 
should say 'play classical radio' to get the one you want. For things like 'Florence + the Machine Radio' I just say 
'play florence' because I haven't done any work to strip weird characters or join words.

## Todo

- get my changes for the ISY library (which was read only) back into that library, or npm my version instead of relying
on the unversioned git repo
- look for a better way of converting "seventy three" to 73
- automatic creation of usernames for Hue (should be trivial, but it
  would be good to add it)
- "scenes" (tasks that can call subtasks; i.e., set the lights *and*
  temperature)
- bi-directional controls... Use the Amazon Echo app to add a todo like 'query thermostats' and we'd update the todo with
the answer.


[wolfram]: https://developer.wolframalpha.com/portal/apisignup.html
[hue-api]: https://github.com/peter-murray/node-hue-api
[youtube]: https://www.youtube.com/watch?v=0I3E-auy8JA
[github-source]: https://github.com/ghballiet/echo-api
[github-jpelzer]: https://github.com/jpelzer/echo-api
[isy99i]: https://www.universal-devices.com/residential/isy-99i/
[lms]: http://en.wikipedia.org/wiki/Logitech_Media_Server
