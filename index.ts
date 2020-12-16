import { Loader } from '@googlemaps/js-api-loader';
import * as https from 'https';
import * as querystring from 'querystring';
import * as poly2tri from 'poly2tri';
import ENV from './environment';

const POLYGON_THRESHOLD: number = 0.01;
const POINT_DENSITY = 1000000;

interface MapInfo {
    thumbnail?: string;
    city?: string;
    state?: string;
    country: string;
    numRounds: number;
    roundTimer: number;
}

interface DesMap {
    boundary: {
        location: [number, number];
        radius: number;
    };
    locations: number[][2];
    numRounds: number;
    plainTitle: string;
    roundTimer: number;
    thumbnail: string;
    title: string;
}

interface OpenMap {
    boundingbox: number[],
    lat: number;
    lon: number;
    geojson: {
        type: string;
        coordinates: any;
    }
}

class Triangle {
    vertices: number[][];
    area: number;

    constructor(v: number[][]) {
        this.vertices = v;
        this.area = this.calcArea(this.vertices[0][0], this.vertices[0][1],
                                 this.vertices[1][0], this.vertices[1][1],
                                 this.vertices[2][0], this.vertices[2][1]);
    }

    private calcArea(x1: number, y1: number,
                x2: number, y2: number,
                x3: number, y3: number): number {
        return Math.abs((x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2))/2);
    }

    private pointInside(point: number[]): boolean {
        let A: number[] = [];

        for(let i = 0; i < 3; i++) {
            A[i+1] = this.calcArea(this.vertices[i][0], this.vertices[i][1],
                        this.vertices[(i+1)%3][0], this.vertices[(i+1)%3][1],
                        point[0], point[1]);
        }

        // Equal within 0.0000001?
        return Math.abs(this.area - (A[1] + A[2] + A[3])) < 0.0000001;
    }

    getRandomPoints(): number[][] {
        let numPoints = this.area * POINT_DENSITY;
        let points: number[][] = [];
        let verts: number[][] = this.vertices;

        while(points.length <= numPoints) {
            let v1: number[] = [verts[1][0] - verts[0][0], verts[1][1] - verts[0][1]];
            let v2: number[] = [verts[2][0] - verts[0][0], verts[2][1] - verts[0][1]];
            let a: number = Math.random();
            let b: number = Math.random();

            let p: number[] = [verts[0][0] + v1[0]*a + v2[0]*b, verts[0][1] + v1[1]*a + v2[1]*b]

            if(this.pointInside(p)) {
                points.push(p);
            }
        }

        return points;
    }

}

function getStartingData (): MapInfo[] | null {
  let data: MapInfo[];
  try {
    data = require('./test_data.json');
    return data;
  } catch (err) {
    console.error('Invalid starting data')
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

function triangulate(coordinates: number[][][]): number[][][] {
    let triangles: number[][][] = [];
    let polygon = [];

    // Set initial polygon for(let a = 0; a < coordinates[0].length; a++) {
    for(let a = 1; a < coordinates[0].length; a++) {
        let x = coordinates[0][a][0];
        let y = coordinates[0][a][1];
        console.log(`New Point: {x: ${x}, y: ${y}}`);
        polygon.push(new poly2tri.Point(x, y));
    }

    let swctx = new poly2tri.SweepContext(polygon);
    // Set following polygons as holes
    for(let a = 1; a < coordinates.length; a++) {
        // Adjust holes using amount from original adjustment
        let hole = [];

        for(let b = 1; b < coordinates[a].length; b++) {
            let x = coordinates[a][b][0];
            let y = coordinates[a][b][1];
            console.log(`New Point: {x: ${x}, y: ${y}}`);
            hole.push(new poly2tri.Point(x, y));
        }

        swctx.addHole(hole);
    }

    swctx.triangulate();
    swctx.getTriangles().forEach((tri, ind) => {

        let points: number[][] = [];

        // Convert from poly2tri.Point type to number[][]
        // and push to points array
        tri.getPoints().forEach(p => {points.push([p.x, p.y])});

        // Correct adjusted points and add them to the triangles array
        triangles[ind] = points;
    });
    return triangles;
}

async function main() {
    const maps: MapInfo[] | null = getStartingData();
    if(!maps) return null;

    for(let i = 0; i < maps.length; i++) {

        getOpenStreetMapData(maps[i]).then((openData: OpenMap) => {
            let rand_points: number[][] = [];
            let triangles: number[][][] = [];

            if(openData.geojson.type === 'MultiPolygon') {

                let coordinates: number[][][][] = openData.geojson.coordinates;
                coordinates.forEach((poly) => {
                    triangles.push(...triangulate(poly));
                });
                
            }else if(openData.geojson.type === 'Polygon') {

                let coordinates: number[][][] = openData.geojson.coordinates;
                triangles = triangulate(coordinates);
                 
            }

            triangles.forEach((tri) => {
                let tester = new Triangle(tri);
                rand_points.push(...tester.getRandomPoints());
            });
            console.log("Number of points calculated: ", rand_points.length);
        }).catch((error: Error) => {
            console.log(error)
        });

    }

}

// const loader = new Loader({
//   apiKey: ENV.google_api_key,
//   version: 'weekly',
//   libraries: ['places']
// })

// loader.load().then(() => {
//     let maps = getStartingData()
//     maps?.forEach(map => console.log(map.city));
// }).catch(err => {
//     console.log(err);
// })

// let streetview: google.maps.StreetViewService;

// function initStreetview (lat: number, lng: number, radius: number): void {
//     streetview = new google.maps.StreetViewService();
//     let latLng = new google.maps.LatLng(lat, lng);

//     streetview.getPanoramaByLocation(latLng, radius, (streetViewPanoramaData: google.maps.StreetViewPanoramaData) => {
//         if(streetViewPanoramaData) {
//             console.log("success");
//         }else {
//             console.log("Error");
//         }
//     })
// }

// initStreetview(49.246495, -122.913943, 100);

main();
