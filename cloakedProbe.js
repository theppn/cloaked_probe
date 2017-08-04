/**
 * Copyright (C) 2017 Anh Bach Quoc - All Rights Reserved
 * Cloaked Probe - Automation of nPerf test using CasperJS/PhantomJS
 * Version 1.0.0
 * ¯\_(ツ)_/¯
 */

/**
 * Edit settings here
 */

var nPerfUrl = 'https://www.nperf.com/fr/'; // url of nPerf
var username = ''; // your nPerf account username
var password = ''; // your nPerf account password
var maxLoop = 4*24*7; // number of tests to perform
var intervalBetweenTest = 15*60; // waiting time between each test in sec
var maxPageLoadingDuration = 2*60; // waiting time of page loading before timeout in sec
var maxTestDuration = 3*60; // waiting time of test duration before timeout in sec
var verbose = true; // log verbosely
var logLevel = 'debug'; // log level ie. debug, info, warning, error

/**
 *  Don't touch these variables
 */
var cloakedProbe = {};
var casper;

/**
 *  Scripts and methods below
 */

/**
 * Logs with automatic timestamp and caller method prefix
 * @param {string} msg - message to log
 */
cloakedProbe.log = function(msg){
    var now = new Date();
    casper.echo("[" + now.toUTCString() + "] " + cloakedProbe.log.caller.name.toString() + ": " + msg);
};

/**
 * Logs HTML content for debugging purpose, don't use it unless test
 */
cloakedProbe.checkContent = function() {
    cloakedProbe.log('cloakedProbe.checkContent: ' + this.getHTML());
    this.exit();
};

/**
 *  Inits configuration
 *  @param {string} username - username of nPerf account
 *  @param {string} password - password of nPerf account
 *  @param {number} maxLoop - number of tests to perform
 *  @param {number} intervalBetweenTest - duration in sec between each loop of tests
 *  @param {number} maxPageLoadingDuration - max duration of page loading before timeout
 *  @param {number} maxTestDuration - max duration of each test before timeout
 *  @param {boolean} verbose - CasperJS verbose logging
 *  @param {string} logLevel - CasperJS log level
 */
cloakedProbe.init = function(username, password, maxLoop, intervalBetweenTest, maxPageLoadingDuration, maxTestDuration, verbose, logLevel) {
    /* static, never edit unless dev */
    cloakedProbe.buffer = {}
    cloakedProbe.buffer.speedTestUrl = "";
    cloakedProbe.buffer.targetStart = ".gaugeStartButton";
    cloakedProbe.buffer.targetRestart = ".gaugeRestartButton";
    cloakedProbe.buffer.loop = 0;
    cloakedProbe.account = {}; // variables related to account
    cloakedProbe.settings = {}; // variables related to settings

    /* cloakedProbe configuration */
    casper = require('casper').create({
        verbose: verbose, // true
        logLevel: logLevel, // "debug"
        loadImages:  true,
        loadPlugins: true,
        javascriptEnabled: true,
    });
    cloakedProbe.account.username = username; //'aquoc@nomosphere.fr'
    cloakedProbe.account.password = password; //'n0m0sphere@1234'
    cloakedProbe.settings.maxLoop = maxLoop; // 10
    cloakedProbe.settings.intervalBetweenTest = intervalBetweenTest*1000 // 3600*1000 (sec)
    cloakedProbe.settings.maxPageLoadingDuration = maxPageLoadingDuration*1000 // 30*1000 (sec)
    cloakedProbe.settings.maxTestDuration = maxTestDuration*1000; //90*1000 (sec)
    cloakedProbe.log('cloakedProbe.init: ready');
};

/**
 *  Performs a single test and recursively loops if necessary
 */
cloakedProbe.launchTest = function() {
    cloakedProbe.log('cloakedProbe.launchTest: start');
    // waiting for nPerf start button to be available
    this.waitForSelector(cloakedProbe.buffer.targetStart, function() {
        if (cloakedProbe.buffer.loop < cloakedProbe.settings.maxLoop) {
            this.waitUntilVisible(cloakedProbe.buffer.targetStart, function() {
                this.click(cloakedProbe.buffer.targetStart);
                cloakedProbe.log('cloakedProbe.launchTest: loop #' + cloakedProbe.buffer.loop + ' started');
                // 2 sec temp as safety dance
                this.wait(2000, function() {
                    this.waitUntilVisible(cloakedProbe.buffer.targetRestart, function() {
                        cloakedProbe.log('cloakedProbe.launchTest: loop #' + cloakedProbe.buffer.loop + ' ended');
                        cloakedProbe.buffer.loop = cloakedProbe.buffer.loop + 1;
                        // wait for restart button instead of start from loop 1 onwards
                        cloakedProbe.buffer.targetStart = ".gaugeRestartButton";
                        cloakedProbe.log('cloakedProbe.launchTest: pause, waiting cloakedProbe.settings.intervalBetweenTest = ' + cloakedProbe.settings.intervalBetweenTest/1000 + "sec" );
                        this.wait(cloakedProbe.settings.intervalBetweenTest, function() {
                            // recursive call
                            cloakedProbe.launchTest.call(this);
                        }.bind(this));
                    }.bind(this), function() {
                        cloakedProbe.log('cloakedProbe.launchTest: maxTestDuration reached, test took too long');
                        cloakedProbe.rerun();
                    }, cloakedProbe.settings.maxTestDuration);
                });
            }, function() {
                cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
                cloakedProbe.rerun();
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }
        else {
            cloakedProbe.log('cloakedProbe.launchTest: maxLoop reached, end of test');
            this.exit();
        }
    },
    function() {
        cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
        cloakedProbe.rerun();
    }, cloakedProbe.settings.maxPageLoadingDuration);
};

/**
 * Logout if necessary
 */
cloakedProbe.logout = function() {
    cloakedProbe.log('cloakedProbe.logout: start');
    this.waitForSelector('#userMenu', function() {
        // if currently logged in, attempt to logout
        if (this.exists('.userIdentity')) {
            cloakedProbe.log('cloakedProbe.logout: currently logged in, attempt to logout');
            this.evaluate(function () {
                userLogout();
            });
            this.waitForSelector('.notyfy_success', function () {
                cloakedProbe.log('cloakedProbe.logout: logout success');
            }, function () {
                cloakedProbe.log('cloakedProbe.logout: logout failure');
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }
        else {
            cloakedProbe.log('cloakedProbe.logout: not logged in, skip');
        }
    }, function() {
        cloakedProbe.log('cloakedProbe.logout: #userMenu not found');
        cloakedProbe.rerun();
    }, cloakedProbe.settings.maxPageLoadingDuration);
};

/**
 *  Authenticates to account logging the test result
 */
cloakedProbe.login = function() {
    cloakedProbe.log('cloakedProbe.login: start');
    // waiting for user menu button
    this.waitForSelector('.borderR2', function() {
        // js to load modal of user login form
        this.evaluate(function() {
            ajaxModalUserLogin('fr',{},'reloadUserMenu();')
        });
        // waiting for username field
        this.waitForSelector('input[name="identity"]', function() {
            cloakedProbe.log('cloakedProbe.login: input[name="identity"] found');
            this.fill('form[name="login_form"]', {
                'identity': cloakedProbe.account.username,
                'credential': cloakedProbe.account.password
            }, false);
            // js to request auth form submission
            this.evaluate(function() {
                nPerfModal.Login.authenticate(document.querySelector('.login-authenticate'));
            });
            // waiting for notification post login attempt
            this.waitForSelector('.notyfy_success', function() {
                cloakedProbe.log('cloakedProbe.login: auth success');
            }, function() {
                cloakedProbe.log('cloakedProbe.login: auth failure');
                cloakedProbe.rerun();
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }, function() {
            cloakedProbe.log('cloakedProbe.login: input[name="identity"] NOT found');
            cloakedProbe.rerun();
        }, cloakedProbe.settings.maxPageLoadingDuration);
    }, function() {
        cloakedProbe.log('cloakedProbe.login: .toolBar.borderL2.borderR2 NOT found');
        cloakedProbe.rerun();
    }, cloakedProbe.settings.maxPageLoadingDuration);
};

/**
 * loads nPerf test iframe
 */
cloakedProbe.loadTest = function() {
    var iframeId = '#nPerfSpeedTest';
    cloakedProbe.log("cloakedProbe.loadTest: start");
    // waiting for iframe and move there
    this.waitForSelector(iframeId, function() {
        cloakedProbe.buffer.speedTestUrl = this.getElementAttribute(iframeId, 'src');
        cloakedProbe.log("cloakedProbe.loadTest: speedTestUrl is " + cloakedProbe.buffer.speedTestUrl);
        this.open(cloakedProbe.buffer.speedTestUrl);
    });
};

/**
 * Runs (main function)
 * @param {string} nPerfUrl - url of nPerf
 * @param {string} username - username of nPerf account
 * @param {string} password - password of nPerf account
 * @param {number} maxLoop - number of tests to perform
 * @param {number} intervalBetweenTest - duration in sec between each loop of tests
 * @param {number} maxPageLoadingDuration - max duration of page loading before timeout
 * @param {number} maxTestDuration - max duration of each test before timeout
 * @param {boolean} verbose - CasperJS verbose logging
 * @param {string} logLevel - CasperJS log level
 */
cloakedProbe.run = function (nPerfUrl, username, password, maxLoop, intervalBetweenTest, maxPageLoadingDuration, maxTestDuration, verbose, logLevel) {
    cloakedProbe.init(username, password, maxLoop, intervalBetweenTest, maxPageLoadingDuration, maxTestDuration, verbose, logLevel);
    casper.start(nPerfUrl);
    casper.then(cloakedProbe.logout);
    // 5 sec temp as safety dance
    casper.wait(5000);
    casper.then(cloakedProbe.login);
    // 5 sec temp as safety dance
    casper.wait(5000);
    casper.then(cloakedProbe.loadTest);
    casper.then(cloakedProbe.launchTest);
};

/**
 * Runs again
 */
cloakedProbe.rerun = function() {
    cloakedProbe.buffer.targetStart = ".gaugeStartButton";
    cloakedProbe.log("cloakedProbe.rerun: start");
    casper.open(nPerfUrl);
    casper.then(cloakedProbe.logout);
    // 5 sec temp as safety dance
    casper.wait(5000);
    casper.then(cloakedProbe.login);
    // 5 sec temp as safety dance
    casper.wait(5000);
    casper.then(cloakedProbe.loadTest);
    casper.then(cloakedProbe.launchTest);
}

/* Run Forest, run! */
cloakedProbe.run(nPerfUrl, username, password, maxLoop, intervalBetweenTest, maxPageLoadingDuration, maxTestDuration, verbose, logLevel);
casper.run();