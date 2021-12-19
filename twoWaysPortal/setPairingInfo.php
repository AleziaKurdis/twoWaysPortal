<?php
header('Content-type: application/json');


if ((isset($_GET["pk"])) && (!empty($_GET["pk"]))){
    $pairingKey = $_GET["pk"];
    
    if ((isset($_GET["pid"])) && (!empty($_GET["pid"]))){
        $doorId = $_GET["pid"];
        
        if ((isset($_GET["pln"])) && (!empty($_GET["pln"]))){
            $placeName = $_GET["pln"];
            
            if ((isset($_GET["add"])) && (!empty($_GET["add"]))){
                $landingAddress = $_GET["add"];

                //read datafile
                $dataFileName = "pairing.dat";
                $data = file_get_contents($dataFileName);
                
                $updatedData = "";
                $pairingEntries = explode("~", $data);
                $first = true;
                $foundAndUpdated = false;
                //find the parining Key recorded and adjust the data
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
                        if ($entryPairingKey == $pairingKey) {
                            if ($PortalID2 == "" && $PortalID1 != $doorId) {
                                
                                $updatedData = $updatedData.$separator.time()."*".$entryPairingKey."*".$PortalID1."*".$destinationUrl1."*";
                                $updatedData = $updatedData.$destinationName1."*".$doorId."*".$landingAddress."*".$placeName;
                                
                            } else {
                                $updatedData = $updatedData.$separator.$pairingEntry;
                            }
                            
                            
                            $foundAndUpdated = true;
                        } else {
                            $updatedData = $updatedData.$separator.$pairingEntry;
                        }                        
                    }
                    
                    
                }
                if ($foundAndUpdated == false) {
                    //on ajoute une nouvelle entry
                    $updatedData = $updatedData."~".time()."*".$pairingKey."*".$doorId."*".$landingAddress."*".$placeName."***"; 
                }
                
                //save datafile
                $fp = fopen($dataFileName, 'w');
                fwrite($fp, $updatedData);
                fclose($fp);             
                
            }else{
                echo("ERROR: No Landing Address.");
            }            
        }else{
            echo("ERROR: No Place name.");
        }
    }else{
        echo("ERROR: No door ID.");
    }
}else{
    echo("ERROR: No pairingKey.");
}
?>