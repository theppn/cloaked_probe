/**
 * Copyright (C) 2017 Anh Bach Quoc - All Rights Reserved
 * Cloaked Probe - Automation of nPerf test using CasperJS/PhantomJS
 * Version 1.2.0
 * ¯\_(ツ)_/¯
 */

/**
 * Edit settings here
 */

var nPerfUrl = 'https://www.nperf.com/fr/'; // url of nPerf
var username = ''; // your nPerf account username
var password = ''; // your nPerf account password
var maxPageLoadingDuration = 2; // waiting time of page loading before timeout in minutes
var maxTestDuration = 10; // waiting time of test duration before timeout in minutes
var verbose = false; // log verbosely
var logLevel = 'debug'; // log level ie. debug, info, warning, error

/**
 *  Don't touch these variables
 */
var cloakedProbe = {};
var casper = null;

/**
 *  Scripts and methods below
 */

/**
 * Logs with automatic timestamp and caller method prefix
 * @param {string} msg - message to log
 */
cloakedProbe.log = function(msg){
    var now = new Date();
    var month = ((now.getMonth()+1) < 10) ? "0" + (now.getMonth()+1) : "" + (now.getMonth()+1);
    var day = (now.getDate() < 10) ? "0" + now.getDate() : "" + now.getDate();
    var hours = (now.getHours() < 10) ? "0" + now.getHours() : "" + now.getHours();
    var minutes = (now.getMinutes() < 10) ? "0" + now.getMinutes() : "" + now.getMinutes();
    var seconds = (now.getSeconds() < 10) ? "0" + now.getSeconds() : "" + now.getSeconds();
    var dateString = '[' + now.getFullYear() + '-' + month + '-' + day + ':' + hours + ':' + minutes + ':' + seconds + '] ';
    casper.echo(dateString + cloakedProbe.log.caller.name.toString() + " " + msg);
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
 *  @param {number} maxPageLoadingDuration - max duration of page loading before timeout
 *  @param {number} maxTestDuration - max duration of each test before timeout
 *  @param {boolean} verbose - CasperJS verbose logging
 *  @param {string} logLevel - CasperJS log level
 */
cloakedProbe.init = function(username, password, maxPageLoadingDuration, maxTestDuration, verbose, logLevel) {
    /* static, never edit unless dev */
    cloakedProbe.buffer = {}
    cloakedProbe.buffer.speedTestUrl = "";
    cloakedProbe.buffer.targetStart = ".gaugeStartButton";
    cloakedProbe.buffer.targetRestart = ".gaugeRestartButton";
    cloakedProbe.buffer.isLoggedIn = false;
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
    cloakedProbe.account.username = username;
    cloakedProbe.account.password = password;
    cloakedProbe.settings.maxPageLoadingDuration = maxPageLoadingDuration*1000*60;
    cloakedProbe.settings.maxTestDuration = maxTestDuration*1000*60;
    cloakedProbe.log('cloakedProbe.init: ready');
};

/**
 *  Performs a single test and recursively loops if necessary
 */
cloakedProbe.launchTest = function() {
    if (cloakedProbe.buffer.isLoggedIn) {
        cloakedProbe.log('cloakedProbe.launchTest: start');
        // waiting for nPerf start button to be available
        this.waitForSelector(cloakedProbe.buffer.targetStart, function() {
            this.waitUntilVisible(cloakedProbe.buffer.targetStart, function() {
                this.click(cloakedProbe.buffer.targetStart);
                cloakedProbe.log('cloakedProbe.launchTest: test started');
                // 2 sec temp as safety dance
                this.wait(2000, function() {
                    this.waitUntilVisible(cloakedProbe.buffer.targetRestart, function() {
                        cloakedProbe.log('cloakedProbe.launchTest: test ended');
                    }.bind(this), function() {
                        cloakedProbe.log('cloakedProbe.launchTest: maxTestDuration reached, test took too long');
                    }, cloakedProbe.settings.maxTestDuration);
                });
            }, function() {
                cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
            }, cloakedProbe.settings.maxPageLoadingDuration);
        },
        function() {
            cloakedProbe.log("cloakedProbe.launchTest: maxPageLoadingDuration reached, can't find " + cloakedProbe.buffer.targetStart + ", timeout");
        }, cloakedProbe.settings.maxPageLoadingDuration);
    }
    else {
        cloakedProbe.log("cloakedProbe.launchTest: not logged in, not starting");
    }
};

/**
 * Logout if necessary
 */
cloakedProbe.logout = function() {
    cloakedProbe.log('cloakedProbe.logout: start');
    this.waitForSelector('#userMenu', function() {
        // if currently logged in, attempt to logout
        if (this.exists('.userIdentity')) {
            cloakedProbe.buffer.isLoggedIn = true;
            cloakedProbe.log('cloakedProbe.logout: currently logged in, attempt to logout');
            this.evaluate(function () {
                userLogout();
            });
            this.waitForSelector('.notyfy_success', function () {
                cloakedProbe.buffer.isLoggedIn = false;
                cloakedProbe.log('cloakedProbe.logout: logout success');
            }, function () {
                cloakedProbe.log('cloakedProbe.logout: logout failure');
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }
        else {
            cloakedProbe.buffer.isLoggedIn = false;
            cloakedProbe.log('cloakedProbe.logout: not logged in, skip');
        }
    }, function() {
        cloakedProbe.log('cloakedProbe.logout: #userMenu not found');
    }, cloakedProbe.settings.maxPageLoadingDuration);
};

/**
 *  Authenticates to account logging the test result
 */
cloakedProbe.login = function() {
    cloakedProbe.log('cloakedProbe.login: start');
    // waiting for user menu button
    this.waitForSelector('.borderR2', function () {
        // js to load modal of user login form
        this.evaluate(function () {
            ajaxModalUserLogin('fr', {}, 'reloadUserMenu();')
        });
        // waiting for username field
        this.waitForSelector('input[name="identity"]', function () {
            cloakedProbe.log('cloakedProbe.login: input[name="identity"] found');
            this.fill('form[name="login_form"]', {
                'identity': cloakedProbe.account.username,
                'credential': cloakedProbe.account.password
            }, false);
            // js to request auth form submission
            this.evaluate(function () {
                nPerfModal.Login.authenticate(document.querySelector('.login-authenticate'));
            });
            // waiting for notification post login attempt
            this.waitForSelector('.notyfy_success', function () {
                cloakedProbe.buffer.isLoggedIn = true;
                cloakedProbe.log('cloakedProbe.login: auth success');
            }, function () {
                cloakedProbe.log('cloakedProbe.login: auth failure');
            }, cloakedProbe.settings.maxPageLoadingDuration);
        }, function () {
            cloakedProbe.log('cloakedProbe.login: input[name="identity"] NOT found');
        }, cloakedProbe.settings.maxPageLoadingDuration);
    }, function () {
        cloakedProbe.log('cloakedProbe.login: .toolBar.borderL2.borderR2 NOT found');
    }, cloakedProbe.settings.maxPageLoadingDuration);
};

/**
 * loads nPerf test iframe
 */
cloakedProbe.loadTest = function() {
    if (cloakedProbe.buffer.isLoggedIn) {
        var iframeId = '#nPerfSpeedTest';
        cloakedProbe.log("cloakedProbe.loadTest: start");
        // waiting for iframe and move there
        this.waitForSelector(iframeId, function() {
            cloakedProbe.buffer.speedTestUrl = this.getElementAttribute(iframeId, 'src');
            cloakedProbe.log("cloakedProbe.loadTest: speedTestUrl is " + cloakedProbe.buffer.speedTestUrl);
            this.open(cloakedProbe.buffer.speedTestUrl);
        });
    }
    else {
        cloakedProbe.log("cloakedProbe.loadTest: not logged in, not starting");
    }
};

/**
 * Runs (main function)
 * @param {string} nPerfUrl - url of nPerf
 * @param {string} username - username of nPerf account
 * @param {string} password - password of nPerf account
 * @param {number} maxPageLoadingDuration - max duration of page loading before timeout
 * @param {number} maxTestDuration - max duration of each test before timeout
 * @param {boolean} verbose - CasperJS verbose logging
 * @param {string} logLevel - CasperJS log level
 */
cloakedProbe.run = function (nPerfUrl, username, password, maxPageLoadingDuration, maxTestDuration, verbose, logLevel) {
    cloakedProbe.init(username, password, maxPageLoadingDuration, maxTestDuration, verbose, logLevel);
    casper.start(nPerfUrl);
    casper.then(cloakedProbe.logout);
    casper.then(cloakedProbe.login);
    casper.then(cloakedProbe.loadTest);
    casper.then(cloakedProbe.launchTest);
};

/* Run Forest, run! */
cloakedProbe.run(nPerfUrl, username, password, maxPageLoadingDuration, maxTestDuration, verbose, logLevel);
casper.run();