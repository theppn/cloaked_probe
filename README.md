#Cloaked Probe
Automation of nPerf test using CasperJS/PhantomJS

##Version
1.2.0

##Requirements
- PhantomJS 1.9.1 or greater available as phantomjs command
- Python 2.6 or greater for casperjs in the bin/ directory
- CasperJS 1.1.0 or greater

If you don't know how to install them: http://docs.casperjs.org/en/latest/installation.html

If you are using a Raspberry PI, you may compile phantomjs yourself or use a pre-compiled binary such as https://github.com/piksel/phantomjs-raspberrypi

Make sure client has the right date and time for accurate logging.

##How to use
- Edit settings in cloakedProbe.js
- Edit settings in wifi_reco.sh
- Add task in cron using crontab -e, for instance:
```
0,15,30,45 * * * * /root/cloaked_probe/wifi_reco.sh && /usr/bin/casperjs /root/cloaked_probe/cloakedProbe.js >> /var/log/cloakedProbe.log

```

##Additional notes
¯\_(ツ)_/¯