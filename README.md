# geoquiz-admin

I built this project to populate the geoquiz database with maps including a list of random valid Google StreetView locations within that region. The basic data for 
each map is input from the data.json file and processed using 3 main tools:
* [Open Street Map](https://nominatim.openstreetmap.org/ui/search.html)
* [Poli2Tri](https://github.com/r3mi/poly2tri.js)
* [Google Maps Streetview API](https://developers.google.com/maps/documentation/javascript/reference/street-view-service?)

After importing the maps from data.json, the script queries Open Street Map for a bounding polygon of the location. To generate random locations within this polygon, it first
has to be triangulated using poly2tri. Once triangulated, random locations can be found using basic geometry and then it's on to the difficult part: Validating StreetView locations...

Working with the Google Maps API was by far the most difficult part of this project. Since it's strictly a **Client-side** API, it only works with a DOM and does not play nicely 
with node. After trying a few different methods I found that the solution is to actually send the code to a client to run. To process the points through the Google API the script 
starts a server and tells the client ([Puppeteer](https://github.com/puppeteer/puppeteer)) to go to that endpoint. The server then sends the client-template.html with the 
injected script to the client. The client processes the points and sends a list of the valid points back to the sever.

After the maps are processed the user is asked to confirm each map before publishing to the database.
