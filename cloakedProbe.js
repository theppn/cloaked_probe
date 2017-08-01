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
var username = 'aquoc@nomosphere.fr'; // your nPerf account username
var password = 'n0m0sphere@1234'; // your nPerf account password
var maxLoop = 10; // number of tests to perform
var intervalBetweenTest = 120; // waiting time between each test in sec
var maxPageLoadingDuration = 30; // waiting time of page loading before timeout in sec
var maxTestDuration = 90; // waiting time of test duration before timeout in sec
var verbose = false; // log verbosely
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
                cloakedProbe.buffer.loop = cloakedProbe.buffer.loop + 1;
                this.click(cloakedProbe.buffer.targetStart);
                cloakedProbe.log('cloakedProbe.launchTest: loop #' + (cloakedProbe.buffer.loop-1) + ' started');
                // 2 sec temp as safety dance
                this.wait(2000, function() {
                    this.waitUntilVisible(cloakedProbe.buffer.targetRestart, function() {
                        cloakedProbe.log('cloakedProbe.launchTest: loop #' + (cloakedProbe.buffer.loop-1) + ' ended');
                        // wait for restart button instead of start from loop 1 onwards
                        cloakedProbe.buffer.targetStart = ".gaugeRestartButton";
                        cloakedProbe.log('cloakedProbe.launchTest: pause, waiting cloakedProbe.settings.intervalBetweenTest = ' + cloakedProbe.settings.intervalBetweenTest/1000 + "sec" );
                        this.wait(cloakedProbe.settings.intervalBetweenTest, function() {
                            // recursive call
                            cloakedProbe.launchTest.call(this);
                        }.bind(this));
                    }.bind(this), function() {
                        cloakedProbe.log('cloakedProbe.launchTest: maxTestDuration reached, test took too long');
                        this.exit();
                    }, cloakedProbe.settings.maxTestDuration);
                });
            }, function() {
                cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
                this.exit();
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }
        else {
            cloakedProbe.log('cloakedProbe.launchTest: maxLoop reached, end of test');
            this.exit();
        }
    },
    function() {
        cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
        this.exit();
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
            this.waitForSelector('#notyfy_container_center', function() {
                if (this.exists('.notyfy_success')) {
                    cloakedProbe.log('cloakedProbe.login: auth success');
                }
                else {
                    cloakedProbe.log('cloakedProbe.login: auth error');
                    this.exit();
                }
            }, function() {
                cloakedProbe.log('cloakedProbe.login: auth failure');
                this.exit();
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }, function() {
            cloakedProbe.log('cloakedProbe.login: input[name="identity"] NOT found');
            this.exit();
        }, cloakedProbe.settings.maxPageLoadingDuration);
    }, function() {
        cloakedProbe.log('cloakedProbe.login: .toolBar.borderL2.borderR2 NOT found');
        this.exit();
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
    casper.then(cloakedProbe.login);
    // 5 sec temp as safety dance
    casper.wait(5000);
    casper.then(cloakedProbe.loadTest);
    casper.then(cloakedProbe.launchTest);
    casper.run();
};

/* Run Forest, run! */
cloakedProbe.run(nPerfUrl, username, password, maxLoop, intervalBetweenTest, maxPageLoadingDuration, maxTestDuration, verbose, logLevel);