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
    var TELEPORTER_SCRIPT_URL = ROOT + "teleporter.js";

    var state = "INACTIVE";
    var destUrl = "";
    var destName = "";
    var hue = 0;
    var destinationData;
    var doorId = Uuid.NULL;
    var creationDate = 0;
    
    var SYNC_SERVICE_URL = "http://metaverse.bashora.com/twoWaysPortal/synchronize.php";
    var httpRequest;
    
    var entityIDsToDelete = [];
    var UPDATE_TIMER_INTERVAL = 12000; // each 2 minutes
    var processTimer = 0;
    var EXPIRATION_TIME = 86400000; //24h

    this.preload = function(entityID) {
        var properties = Entities.getEntityProperties(entityID, ["userData", "created"]);
        creationDate = properties.created;
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
            if ((today.getTime() - (creationDate/1000)) > EXPIRATION_TIME) {
                state = "EXPIRED";
                Script.update.disconnect(myTimer);
                killLocalEntities();
                setPortalLocalentities();                
            }
            
            if (state === "PENDING") {
                var response = synchronize(SYNC_SERVICE_URL + "?pk=" + destinationData.pairingKey + "&pid=" + doorId);
                var responseObj =  JSON.parse(response);
                if (responseObj.destinationUrl !== "") {
                    destinationData.destinationUrl = responseObj.destinationUrl;
                    destinationData.destinationName = responseObj.destinationName;
                    destinationData.state = "ACTIVE";
                    destinationData.colorHue = sumAscii(responseObj.destinationName)%360;
                    var properties = Entities.getEntityProperties(doorId, ["locked"]);
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
        var id;
        var properties = Entities.getEntityProperties(doorId, ["renderWithZones", "dimensions"]);
        
        if (state === "PENDING") {
            //TEXT
            id = Entities.addEntity({
                    "type": "Text",
                    "name": "PENDING",
                    "dimensions": {
                        "x": 1.6928883790969849,
                        "y": 0.30000001192092896,
                        "z": 0.009999999776482582
                    },
                    "renderWithZones": properties.renderWithZones,
                    "parentID": doorId,
                    "localPosition": {"x": 0 , "y": 1.2918, "z": -0.33},
                    "localRotation": Quat.IDENTITY,                    
                    "grab": {
                        "grabbable": false
                    },
                    "text": "PENDING",
                    "textColor": {
                        "red": 255,
                        "green": 225,
                        "blue": 0
                    },
                    "lineHeight": 0.1,
                    "topMargin": 0.09,
                    "unlit": true,
                    "alignment": "center",
                    "visible": true
                }, "local"); 
            entityIDsToDelete.push(id);
            
        } else if (state === "EXPIRED") {
            //TEXT
            id = Entities.addEntity({
                    "type": "Text",
                    "name": "EXPIRED",
                    "dimensions": {
                        "x": 1.6928883790969849,
                        "y": 0.30000001192092896,
                        "z": 0.009999999776482582
                    },
                    "renderWithZones": properties.renderWithZones,
                    "parentID": doorId,
                    "localPosition": {"x": 0 , "y": 1.2918, "z": -0.33},
                    "localRotation": Quat.IDENTITY,                    
                    "grab": {
                        "grabbable": false
                    },
                    "text": "PAIRING EXPIRED",
                    "textColor": {
                        "red": 255,
                        "green": 128,
                        "blue": 0
                    },
                    "lineHeight": 0.1,
                    "topMargin": 0.09,
                    "unlit": true,
                    "alignment": "center",
                    "visible": true
                }, "local"); 
            entityIDsToDelete.push(id);
            
        } else if (state === "ACTIVE") {
            var color = hslToRgb(hue/360, 1, 0.65);
            //TELEPORTER
            id = Entities.addEntity({
                    "name": "TP-Trigger",
                    "type": "Shape",
                    "shape": "Cube",
                    "renderWithZones": properties.renderWithZones,
                    "dimensions": properties.dimensions,
                    "parentID": doorId,
                    "localPosition": Vec3.ZERO,
                    "localRotation": Quat.IDENTITY,
                    "script": TELEPORTER_SCRIPT_URL,
                    "userData": "hifi://" + destName + destUrl,
                    "visible": false
                }, "local"); 
            entityIDsToDelete.push(id);
            
            //MATERIAL

            var sumColorCompnent = (color[0]/255) +(color[1]/255) +(color[2]/255);
            if (sumColorCompnent === 0) { 
                sumColorCompnent = 0.001; 
            }
            var bloomFactor = 5 / sumColorCompnent;

            var materialContent = {
                "materialVersion": 1,
                "materials": [
                        {
                            "name": "LIGHT",
                            "albedo": [(color[0]/255), (color[1]/255), (color[2]/255)],
                            "metallic": 0.01,
                            "roughness": 0.01,
                            "opacity": 1,
                            "emissive": [(color[0]/255) * bloomFactor, (color[1]/255) * bloomFactor, (color[2]/255) * bloomFactor],
                            "scattering": 0,
                            "unlit": false,
                            "cullFaceMode": "CULL_NONE",
                            "model": "hifi_pbr"
                        }
                    ]
                };
            
            id = Entities.addEntity({
                "type": "Material",
                "parentID": doorId,
                "renderWithZones": properties.renderWithZones,
                "locked": false,
                "localPosition": {"x": 0.0, "y": 0.2, "z": 0.0},
                "name": "TP-Material",
                "materialURL": "materialData",
                "priority": 1,
                "parentMaterialName":  "mat::LIGHT",
                "materialData": JSON.stringify(materialContent)
            },"local");
            entityIDsToDelete.push(id);

            
            //TEXT
            id = Entities.addEntity({
                    "type": "Text",
                    "name": "PortalName",
                    "dimensions": {
                        "x": 1.6928883790969849,
                        "y": 0.30000001192092896,
                        "z": 0.009999999776482582
                    },
                    "renderWithZones": properties.renderWithZones,
                    "parentID": doorId,
                    "localPosition": {"x": 0 , "y": 1.2918, "z": -0.33},
                    "localRotation": Quat.IDENTITY,                    
                    "grab": {
                        "grabbable": false
                    },
                    "text": destName,
                    "lineHeight": 0.1,
                    "textColor": {
                        "red": color[0],
                        "green": color[1],
                        "blue": color[2]
                    },
                    "topMargin": 0.09,
                    "unlit": true,
                    "alignment": "center",
                    "visible": true
                }, "local"); 
            entityIDsToDelete.push(id);
            
            //PARTICLE
            
            //LIGHT
            id = Entities.addEntity({
                "renderWithZones": properties.renderWithZones,
                "parentID": doorId,
                "locked": false,            
                "localPosition": {"x": 0.0, "y": 0.0, "z": 0.0},
                "name": "TP_Light",
                "grab": {
                    "grabbable": false
                },
                "type": "Light",
                "dimensions": {
                    "x": 3,
                    "y": 3,
                    "z": 3
                },
                "color": {
                        "red": color[0],
                        "green": color[1],
                        "blue": color[2]
                    },
                "intensity": 5,
                "falloffRadius": 0.7,
                "isSpotlight": false,
                "visible": true
            },"local");
            entityIDsToDelete.push(id);        
            //SOUND
            
        }        
    }

    // ################## COLOR FUNCTIONS ####################################
    /*
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

})
