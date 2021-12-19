"use strict";
//
//  portal.js
//
//  Created by Alezia Kurdis, December 18th 2021.
//
//  Teleporter with auto-pairing functionality.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function(){ 

    var jsMainFileName = "portal.js";
    var ROOT = Script.resolvePath('').split(jsMainFileName)[0];

    var state = "INACTIVE";
    var destUrl = "";
    var destName = "";
    var hue = 0;
    var destinationData;
    var doorId = Uuid.NULL;
    
    var SYNC_SERVICE_URL = "http://metaverse.bashora.com/twoWaysPortal/synchronize.php";
    var httpRequest;
    
    var entityIDsToDelete = [];
    var UPDATE_TIMER_INTERVAL = 300000; // each 5 minutes
    var processTimer = 0;

    this.preload = function(entityID) {
        var properties = Entities.getEntityProperties(entityID, ["userData"]);
        var data = properties.userData;
        doorId = entityID;

        if (data !== "") {
            destinationData = JSON.parse(data);
            state = destinationData.state;
            destUrl = destinationData.destinationUrl;
            destName = destinationData.destinationName;
            hue = destinationData.colorHue;
            if (state === "PENDING") {
                Script.update.connect(myTimer);
            }
            setPortalLocalentities();
        }

    };

    function killLocalEntities(){
        for (var j=0; j < entityIDsToDelete.length; j++) {
            Entities.deleteEntity(entityIDsToDelete[j]);
        }
        entityIDsToDelete = [];
    }

    this.unload = function(entityID) {
        killLocalEntities();
    };  

    function synchronize(url) {
        httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", url, false);
        httpRequest.send( null );
		return httpRequest.responseText;        
    }

    function sumAscii(str) {
        var sum = 0;
        for (var i = 0; i < str.length; i++) {
            sum += str.charCodeAt(i);
        }
        return sum;
    }

    function myTimer(deltaTime) {
        var today = new Date();
        if ((today.getTime() - processTimer) > UPDATE_TIMER_INTERVAL) {
            
            if (state === "PENDING") {
                var response = synchronize(SYNC_SERVICE_URL + "?pk=" + destinationData.pairingKey + "&pid=" + doorId);
                var responseObj =  JSON.parse(response);
                if (responseObj.destinationUrl !== "") {
                    destinationData.destinationUrl = responseObj.destinationUrl;
                    destinationData.destinationName = responseObj.destinationName;
                    destinationData.state = "ACTIVE";
                    destinationData.colorHue = sumAscii(responseObj.destinationName)%360;
                    var properties = Entities.getEntityProperties(entityID, ["locked"]);
                    if (properties.locked === true) {
                        Entities.editEntity(doorId, {"locked": false});
                    }                    
                    var test = Entities.editEntity(doorId, {"userData": JSON.stringify(destinationData), "locked": true});
                    
                    if (test !== Uuid.NULL) {
                        state = "ACTIVE";
                        destUrl = destinationData.destinationUrl;
                        destName = destinationData.destinationName;
                        hue = destinationData.colorHue;
                        Script.update.disconnect(myTimer);
                        killLocalEntities();
                        setPortalLocalentities();
                    }
                }                
            }

            processTimer = today.getTime();
        }  
    }

    function setPortalLocalentities() {
        if (state === "PENDING") {
            /*
            var id = Entities.addEntity({
               
                }, "local"); 
            entityIDsToDelete.push(id);
            */
        } else if (state === "ACTIVE") {
            
        }        
    }

    this.enterEntity = function(entityID) {
        if (state === "ACTIVE") {
            print("TP URL = hifi://" + destName + destUrl);
            //Window.location = "hifi://" + destName + destUrl;
        }
    }   


})
