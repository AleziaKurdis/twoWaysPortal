"use strict";
//
//  twoWaysPortal.js
//
//  Created by Alezia Kurdis, December 15th 2021.
//
//  Vircadia's application to install 2 ways teleporters.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function() {
    var jsMainFileName = "twoWaysPortal.js";
    var ROOT = Script.resolvePath('').split(jsMainFileName)[0];
    
    var APP_NAME = "2 WAYS TP";
    var APP_URL = ROOT + "twoWaysPortal.html";
    var APP_ICON_INACTIVE = ROOT + "icon_inactive.png";
    var APP_ICON_ACTIVE = ROOT + "icon_active.png";
    var appStatus = false;
    var channel = "com.vircadia.twoWaysPortal";
    var step = 1;
    var actionTime = 0;
    var ANTI_MULIPLE_ACTION_DELAY = 2000; // 2 sec.
    
    var PAIRING_SERVICE_URL = "http://metaverse.bashora.com/twoWaysPortal/setPairingInfo.php";
    var httpRequest = null;
    
    var PORTAL_SCRIPT_URL = ROOT + "portal.js";

    var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    var pairingKey;
    var doorId = Uuid.NULL;

    tablet.screenChanged.connect(onScreenChanged);

    var button = tablet.addButton({
        text: APP_NAME,
        icon: APP_ICON_INACTIVE,
        activeIcon: APP_ICON_ACTIVE
    });


    function clicked(){
        if (appStatus === true) {
            tablet.webEventReceived.disconnect(onMoreAppWebEventReceived);
            tablet.gotoHomeScreen();
            appStatus = false;
        }else{
            //Launching the Application UI. 
            var properties = Entities.getEntityProperties(doorId, ["name"]);
            if (properties.name === undefined && step === 3) {
                step = 1;
                doorId = Uuid.NULL;
            }
            tablet.gotoWebScreen(APP_URL + "?step=" + step);
            tablet.webEventReceived.connect(onMoreAppWebEventReceived);
            appStatus = true;
        }

        button.editProperties({
            isActive: appStatus
        });
    }

    button.clicked.connect(clicked);


    function onMoreAppWebEventReceived(message) {
        if (typeof message === "string") {
            var d = new Date();
            var currently = d.getTime();
            eventObj = JSON.parse(message);
            if(eventObj.channel === channel && eventObj.action === "REZ_DOOR" && (currently - actionTime) > ANTI_MULIPLE_ACTION_DELAY){
                actionTime = currently;
                pairingKey = eventObj.pairingKey;
                step = 3;
                //rez door
                doorId = Entities.addEntity({
                        "type": "Model",
                        "name": "2_WAYS_PORTAL_DOOR",
                        "position": Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 0.5, z: -3 })),
                        "rotation": MyAvatar.orientation,
                        "dimensions": {
                            "x": 2,
                            "y": 2.9999,
                            "z": 0.9378
                        },
                        "grab": {
                            "grabbable": false
                        },
                        "shapeType": "static-mesh",
                        "modelURL": ROOT + "door.fbx",
                        "useOriginalPivot": false                    
                    },"domain");

                //We could reply using: 
                //tablet.emitScriptEvent(JSON.stringify(anyJSONObject));
            }
            if(eventObj.channel === channel && eventObj.action === "ACTIVATE_DOOR" && (currently - actionTime) > ANTI_MULIPLE_ACTION_DELAY){
                actionTime = currently;                
                var properties = Entities.getEntityProperties(doorId, ["position", "rotation", "locked"]);
                //ATTENTION if fault conuté le offset pour la position A FAIRE ###############################
                
                var positionGroup = "/" + properties.position.x.toFixed(4) + "," + properties.position.y.toFixed(4) + "," + properties.position.z.toFixed(4);
                var rotationGroup = "/" + properties.rotation.x.toFixed(5) + "," + properties.rotation.y.toFixed(5) + "," + properties.rotation.z.toFixed(5) + "," + properties.rotation.w.toFixed(5);
                var placename = location.hostname;
                var landingAddress =  positionGroup + rotationGroup;
                
                //Set userdata
                if (properties.locked === true) {
                    Entities.editEntity(doorId, {"locked": false});
                }
                var userData = {
                    "pairingKey": pairingKey,
                    "state": "PENDING",
                    "destinationUrl": "",
                    "destinationName": "",
                    "colorHue": 0
                };
                Entities.editEntity(doorId, {"userData": JSON.stringify(userData)});
                
                //Send the data
                sendToPairingService(PAIRING_SERVICE_URL + "?pk=" + pairingKey + "&pid=" + doorId + "&pln=" + encodeURI(placename) + "&add=" + encodeURI(landingAddress));
                
                //Set Script
                Entities.editEntity(doorId, {"script": PORTAL_SCRIPT_URL, "locked": true});
            }
        }
    }

    function sendToPairingService(url) {
        httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", url, false); // false for synchronous request
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

    function onScreenChanged(type, url) {
        if (type == "Web" && url.indexOf(APP_URL) != -1) {
            appStatus = true;
            //Here we know that the HTML UI is loaded.
            //We could communitate to it here as we know it is loaded. Using:
            //tablet.emitScriptEvent(JSON.stringify(anyJSONObject));

        } else {
            appStatus = false;
        }
        
        button.editProperties({
            isActive: appStatus
        });
    }

    function cleanup() {

        if (appStatus) {
            tablet.gotoHomeScreen();
            tablet.webEventReceived.disconnect(onMoreAppWebEventReceived);
        }

        tablet.screenChanged.disconnect(onScreenChanged);
        tablet.removeButton(button);
    }

    Script.scriptEnding.connect(cleanup);
}());
