#!/bin/bash
# Settings below
# Path to log file
LOG='/var/log/wifi_reco.log'
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

# Functions here
# Logs with timestamp
function log {
    DATE=$(date +%Y-%m-%d:%H:%M:%S)
    echo "[$DATE]\\: $1" >> $LOG
}

# Checks if AP is reachable
# Returns 0 on success, 1 on failure
function isApReachable {
    log "isApReachable start"
    COUNT=$(iwlist "$W_ITF_NAME" scan | grep ESSID | grep -c "$AP_SSID")
    if (( COUNT > 0 ))
    then
        log "$COUNT matching APs found"
        echo 0
    else
        log "No matching AP found"
        echo 1
    fi
}

# Checks if interface is up
# Returns 0 on success, 1 otherwise
function isItfUp {
    log "isItfUp start"
    TEST_ITF1=$(ifconfig | grep -c "$W_ITF_NAME")
    if (( TEST_ITF1 < 1 ))
    then
        log "Interface $W_ITF_NAME not found or down, attempt to turn it on"
        ifconfig "$W_ITF_NAME" up
        TEST_ITF2=$(ifconfig | grep -c "$W_ITF_NAME")
        if (( TEST_ITF2 < 1 ))
        then
            log "Interface $W_ITF_NAME not found or still down"
            echo 1
        else
            log "Interface $W_ITF_NAME is up"
            echo 0
        fi
    else
        log "Interface $W_ITF_NAME is up"
        echo 0
    fi
}

# Checks if current connection is working
# Returns 0 on success, 1 otherwise
function isConnectionWorking {
    log "isConnectionWorking start"
    # Pings 2 times to check connection is working
    ping -c2 "$SERVER" > /dev/null
    if (( $? != 0 ))
    then
        log "Ping failed, connection is down"
        echo 1
    else
        log "Ping succeeded, connection is up"
        echo 0
    fi
}

# Checks that device is connected to right AP
# Returns 0 on success, 1 if wrong AP
function isConnectedToAp {
    log "isConnectedToAp start"
    AP_SSID_CONNECTED=$(iwconfig $W_ITF_NAME | grep -Eo "ESSID\\:.*" | awk -F":" '{ print $2}' | awk -F"\"" '{ print $2}')
    if [ "$AP_SSID_CONNECTED" == "$AP_SSID" ]
    then
        log "Connected to $AP_SSID_CONNECTED, OK"
        echo 0
    else
        log "Connected to $AP_SSID_CONNECTED instead of $AP_SSID, NOK"
        echo 1
    fi
}

# Connects to AP
function connectToAp {
    log "connectToAp start"
    if [ "$AP_MODE" == "WEP" ]
    then
        if [ "$AP_PWD" == "" ]
        then
            log "Attempt via $W_ITF_NAME connection to $AP_SSID with no password"
            iwconfig $W_ITF_NAME essid "$AP_SSID" && dhclient $W_ITF_NAME
        else
            log "Attempt via $W_ITF_NAME connection to $AP_SSID with WEP password"
            iwconfig $W_ITF_NAME essid "$AP_SSID" key s:$AP_PWD && dhclient $W_ITF_NAME
        fi
    else
        log "Attempt via $W_ITF_NAME connection to $AP_SSID with WPA password"
        wpa_supplicant -B -i $W_ITF_NAME -c <(wpa_passphrase "$AP_SSID" $AP_PWD) && dhclient $W_ITF_NAME
    fi
}

# Controller here
function run {
    log "run start"
    ITF_TEST=$(isItfUp)
    if (( ITF_TEST < 1 ))
    then
        AP_TEST=$(isConnectedToAp)
        if (( AP_TEST < 1 ))
        then
            log "run success"
            exit
        else
            AP_REACHABLE_TEST=$(isApReachable)
            if (( AP_REACHABLE_TEST < 1 ))
            then
                connectToAp
                isConnectionWorking
                rerun
            else
                rerun
            fi
        fi
    else
        rerun
    fi
}

function rerun {
    if (( RETRY > 0 ))
    then
        (( RETRY-- ))
        log "rerun start"
        run
    else
        log "max retry reached"
        exit
    fi
}

run
