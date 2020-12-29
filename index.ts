import { promisify } from 'util';
import Prompt from 'prompt-sync';
import * as https from 'https';
import * as querystring from 'querystring';
import ENV from './environment';
import uploadMap from './Firebase';
import { initStreetViewService } from './StreetViewVerifier';
import { Triangle, triangulate } from './Triangulate'

const POLYGON_THRESHOLD: number = 0.01;

interface MapInfo {
    thumbnail: string;
    city?: string;
    state?: string;
    country: string;
    numRounds: number;
    roundTimer: number;
}

interface Map {
    boundary: {
        location: [number, number];
        radius: number;
    };
    locations: number[][];
    numRounds: number;
    plainTitle: string;
    roundTimer: number;
    thumbnail: string;
    title: string;
}

interface OpenMap {
    boundingbox: string[],
    lat: number;
    lon: number;
    display_name: string,
    geojson: {
        type: string;
        coordinates: any;
    }
}

function getStartingData (): MapInfo[] | null {
  let data: MapInfo[];
  try {
    data = require('./test_data.json');
    return data;
  } catch (err) {
    console.error(err);
  }
    return null;
}

const getOpenStreetMapData = (map: MapInfo) =>
    new Promise<OpenMap>((resolve, reject) => {
        const params = {
            city: map.city,
            state: map.state,
            country: map.country,
            polygon_geojson: 1,
            format: "jsonv2",
            polygon_threshold: POLYGON_THRESHOLD
        };
        const options = {
            hostname: "nominatim.openstreetmap.org",
            path: `/search.php?${querystring.stringify(params)}`,
            method: "POST",
            headers: {
                'User-Agent': ENV.user_agent
            }
        }

        const req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            let jsonString = '';

            res.on('data', (data) => {
                data = data.toJSON();
                for(let i = 0; i < data.data.length; i++) {
                    jsonString += String.fromCharCode(data.data[i]);
                }
            })

            res.on('close', () => {
                let result: OpenMap = JSON.parse(jsonString)[0];
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.error("ERROR:", error);
            reject(error);
        });

        req.end();

    });

async function main() {
    const startingData: MapInfo[] | null = getStartingData();
    if(!startingData) return null;

    const streetViewService: google.maps.StreetViewService = await initStreetViewService();

    const maps: Map[] = [];

    for(let i = 0; i < startingData.length; i++) {

        const processedMap = await getOpenStreetMapData(startingData[i])
            .then((openData: OpenMap): {openData: OpenMap, rand_points: number[][]} => {
            let rand_points: number[][] = [];
            let triangles: number[][][] = [];

            // Triangulate the region
            if(openData.geojson.type === 'MultiPolygon') {
                let coordinates: number[][][][] = openData.geojson.coordinates;
                coordinates.forEach((poly) => {
                    triangles.push(...triangulate(poly));
                });
            }else if(openData.geojson.type === 'Polygon') {
                let coordinates: number[][][] = openData.geojson.coordinates;
                triangles = triangulate(coordinates);
            }

            // Generate random points in a triangle
            triangles.forEach((tri) => {
                let tester = new Triangle(tri);
                let points = tester.getRandomPoints();

                // Filter to only streetview usable maps
                points.forEach(async (point) => {
                    const request: google.maps.StreetViewLocationRequest = {
                        location: {
                            lat: point[0],
                            lng: point[1]
                        },
                        preference: google.maps.StreetViewPreference.NEAREST,
                        radius: 10
                    }
                    const getPanorama = promisify(streetViewService.getPanorama);
                    const status = await getPanorama(request).then((status) => {
                        console.log(status);
                        return status;
                    });
                    if(status === google.maps.StreetViewStatus.OK) {
                        rand_points.push(point);
                    } else {
                        console.log(status);
                    }
                });
            
            });

            return {openData, rand_points};
        }).catch((error: Error) => {
            console.log(error)
        });

        if(processedMap) {
            maps.push({
                boundary: {
                    location: [
                        processedMap.openData.lat,
                        processedMap.openData.lon
                        ],
                    radius: Math.max(
                        Math.abs(Number(processedMap.openData.boundingbox[1])-
                            Number(processedMap.openData.boundingbox[0])),
                        Math.abs(Number(processedMap.openData.boundingbox[3])-
                            Number(processedMap.openData.boundingbox[2])))
                },
                locations: processedMap.rand_points,
                numRounds: startingData[i].numRounds,
                roundTimer: startingData[i].roundTimer,
                thumbnail: startingData[i].thumbnail,
                title: processedMap.openData.display_name.split(',')[0],
                plainTitle: processedMap.openData.display_name.split(',')[0].toLowerCase()
            })
        }
    }

    const prompt = Prompt();

    for(let i = 0; i < maps.length; i++) {
        console.log("Title: " + maps[i].title);
        console.log("Number of Points: " + maps[i].locations.length);
        console.log("Num Rounds " + maps[i].numRounds);
        console.log("Round Timer " + maps[i].roundTimer);

        const publishPrompt = prompt("confirm an publish? (Y/n): ");

        if(publishPrompt === "Y") {
           await uploadMap(maps[i]);
            console.log("Uploaded");
        } else {
            console.log("Skipped map");
        }
    }
}

main().then(() => {
    process.exit();
});
