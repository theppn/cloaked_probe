#Cloaked Probe
Automation of nPerf test using CasperJS/PhantomJS

##Version
1.2.0

##Description
This is a set of tools meant to help you set up a system which will automatically connect to a WiFi access point and test its Internet bandwidth using nPerf website.

It is designed to run on a nBox but it can work on anything running Linux, including a Raspberry Pi for instance.

##Requirements
For cloakedProbe:
- PhantomJS 1.9.1 or greater available as phantomjs command
- Python 2.6 or greater for casperjs in the bin/ directory
- CasperJS 1.1.0 or greater  available as casperjs command
- a nPerf account

For WiFi Reconnect script:
- ping
- ifconfig
- iwconfig
- iwlist
- wpa_supplicant
- wpa_passphrase
- dhclient
- grep
- awk
- timeout

Make sure client has the right date and time for accurate logging. You are very likely going to need to be root at least for WiFi Reconnect script to work.

If you don't know how to install them: http://docs.casperjs.org/en/latest/installation.html


##How to use
This guide assumes that you are root, the working directory is "/root/cloaked_probe/", and log file is stored at "/var/log/cloakedProbe.log".
- Clone repository using git or download and extract the archive in the directory.
```
$ cd /root
$ git clone https://gitlab.com/aquoc/cloaked_probe.git
$ cd /root/cloaked_probe
```
- Edit settings in cloakedProbe.js. Replace xxx and yyy with your nPerf account credentials. You probably don't need to edit the other values.
```
var nPerfUrl = 'https://www.nperf.com/fr/'; // url of nPerf
var username = 'xxx'; // your nPerf account username
var password = 'yyy'; // your nPerf account password
var maxPageLoadingDuration = 3; // waiting time of page loading before timeout in minutes
var maxTestDuration = 10; // waiting time of test duration before timeout in minutes
var verbose = false; // log verbosely
var logLevel = 'debug'; // log level ie. debug, info, warning, error
```
- Edit settings in wifi_reco.sh. It is recommended to put RETRY=3 or more because your WiFi card may take a while to start and is likely to fail the test several times before going up.
```
# Settings below
# Path to log file
LOG='/var/log/cloakedProbe.log'
# Server to ping for connection test
SERVER='nperf.com'
# Name of wireless interface to test
W_ITF_NAME='wlan0'
# Connection mode of access point to test, can be WEP or WPA
AP_MODE='WEP'
# SSID of access point to test
AP_SSID='_SNCF gare-gratuit'
# Password of access point to test, leave empty if no password
AP_PWD=''
# Number of retry before giving up
RETRY=3
```
- You may need to create log file if it does not exists and give write access
```
$ touch /var/log/cloakedProbe.log
$ chmod 755 /var/log/cloakedProbe.log
```
- Launch cron as root
```
$ crontab -e
```
- Add task at the end of the file, for instance for a test every 15 minutes:
```
0,15,30,45 * * * * /root/cloaked_probe/wifi_reco.sh && /usr/bin/casperjs /root/cloaked_probe/cloakedProbe.js >> /var/log/cloakedProbe.log

```

##Additional notes
###Nice things to know about WiFi Reconnect script
- WiFi Reconnect script exits with code 0 on success and code 1 on failure.

###Random knowledge
Did you know that in Javascript, parseInt(null,24) returns 23? ¯\_(ツ)_/¯