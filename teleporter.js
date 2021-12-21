"use strict";
//
//  teleporter.js
//
//  Created by Alezia Kurdis, December 19th, 2021.
//
//  teleporter script.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function(){ 
    var jsMainFileName = "teleporter.js";
    var ROOT = Script.resolvePath('').split(jsMainFileName)[0];    
    
    var TP_SOUND_URL = ROOT + "tp-sound.mp3";
    var teleportSound;
    
    var destinationData;
    
    this.preload = function(entityID) {
        var properties = Entities.getEntityProperties(entityID, ["userData"]);
        destinationData = properties.userData;
        
        teleportSound = SoundCache.getSound(TP_SOUND_URL);
        
    }

    this.enterEntity = function(entityID) {   
        playSound();
        Window.location = destinationData;
    }     

    function playSound() {
        Audio.playSound(teleportSound, { volume: 0.3, localOnly: true });
    };

})