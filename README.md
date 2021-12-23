# twoWaysPortal  
Vircadia's application to create bidirectional portals.

# Description
This tool simplify the setup of bidirectional portals using a simple "pairing key".  

It can be useful to set up a two way teleporter:  
- between two places in the same domain.  
- between two domains from the same owner  
- between two domains from different owners  

The advantages of a bidirectional portal are:  
- A win-win exchange of visitors from both sides  
- A more natural way for humans to navigate between places. The ability to retrace your steps and be followed by guests.  
- Create an enriching regionalization  

The tool uses a pairing service to establish the configurations.  
But once the configuration gets established, the portals do not depend on any service.   
  
## To use:   
In Vircadia, run the following script ("Edit > Running Scripts..."  then "FROM URL")  
https://aleziakurdis.github.io/twoWaysPortal/twoWaysPortal.js


## Php service  
To have the solution working, you must install the 3 php files (in the twoWaysPortal directory) on a reachable web server.  
You will also have to adjust the url to your php page in the files: "twoWaysPortal.js" and "portal.js".
