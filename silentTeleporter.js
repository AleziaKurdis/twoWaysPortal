"use strict";
//
//  silentTeleporter.js
//
//  Created by Alezia Kurdis, December 19th, 2021.
//
//  teleporter script withoit any teleportation sound.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function(){ 
    var jsMainFileName = "silentTeleporter.js";
    var ROOT = Script.resolvePath('').split(jsMainFileName)[0];    
    
    
    var destinationData;
    
    this.preload = function(entityID) {
        var properties = Entities.getEntityProperties(entityID, ["userData"]);
        destinationData = properties.userData;
        
    }

    this.enterEntity = function(entityID) {   
        Window.location = destinationData;
    }     

})