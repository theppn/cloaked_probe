#Cloaked Probe
Automation of nPerf test using CasperJS/PhantomJS

##Version
1.1.0

##Requirements
- PhantomJS 1.9.1 or greater available as phantomjs command
- Python 2.6 or greater for casperjs in the bin/ directory
- CasperJS 1.1.0 or greater

If you don't know how to install them: http://docs.casperjs.org/en/latest/installation.html

If you are using a Raspberry PI, you may compile phantomjs yourself or use a pre-compiled binary such as https://github.com/piksel/phantomjs-raspberrypi

Make sure client has the right date and time for accurate logging.

##How to use
- Edit settings in cloakedProbe.js
```
var nPerfUrl = 'https://www.nperf.com/fr/'; // url of nPerf
var username = 'myusername'; // your nPerf account username
var password = 'mypassword'; // your nPerf account password
var maxLoop = 10; // number of tests to perform
var intervalBetweenTest = 3600; // waiting time between each test in sec
var maxPageLoadingDuration = 30; // waiting time of page loading before timeout in sec
var maxTestDuration = 90; // waiting time of test duration before timeout in sec
var verbose = true; // log verbosely
var logLevel = 'debug'; // log level ie. debug, info, warning, error
```
- Run command
```
casperjs cloakedProbe.js >> cloakedProbe.log
```

##Additional notes
¯\_(ツ)_/¯