<?php
header('Content-type: application/json');

//  synchronize.php
//
//  Created by Alezia Kurdis, December 15th 2021.
//
//  Vircadia's application to install 2 ways teleporters.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

if ((isset($_GET["pk"])) && (!empty($_GET["pk"]))){
    $pairingKey = $_GET["pk"];
    
    if ((isset($_GET["pid"])) && (!empty($_GET["pid"]))){
        $doorId = $_GET["pid"];
        


                //read datafile
                $dataFileName = "pairing.dat";
                $data = file_get_contents($dataFileName);
                
                $updatedData = "";
                $pairingEntries = explode("~", $data);
                $first = true;
                //find the parining Key recorded to return the response
                //delete if outdated
                foreach($pairingEntries as $key => $pairingEntry) {
                    $properties = explode("*", $pairingEntry);
                    //~timestamp*pairingKey*PortalID1*destinationURL1*destinationName1*PortalID2*destinationURL2*destinationName2
                    $entryTimestamp = $properties[0];
                    $entryPairingKey = $properties[1];
                    $PortalID1 = $properties[2];
                    $destinationUrl1 = $properties[3]; 
                    $destinationName1 = $properties[4]; 
                    $PortalID2 = $properties[5];
                    $destinationUrl2 = $properties[6]; 
                    $destinationName2 = $properties[7];
                    $separator = "~";
                    if ($first) {
                        $separator = "";
                        $first = false;
                    }
                    
                    if (time() - $entryTimestamp < 86400) {
                        $updatedData = $updatedData.$separator.$pairingEntry;
                        if ($entryPairingKey == $pairingKey) {
                            if ($PortalID1 != $doorId) {
                                $Response = '{"destinationUrl": "'.$destinationUrl2.'", "destinationName": "'.$destinationName2.'"}';
                                echo($Response);
                            }
                            if ($PortalID2 != $doorId) {
                                $Response = '{"destinationUrl": "'.$destinationUrl1.'", "destinationName": "'.$destinationName1.'"}';
                                echo($Response);
                            }
                        }                        
                    }
                     
                }
                
                //save datafile
                $fp = fopen($dataFileName, 'w');
                fwrite($fp, $updatedData);
                fclose($fp);             
                

    }else{
        echo("ERROR: No door ID.");
    }
}else{
    echo("ERROR: No pairingKey.");
}
?>