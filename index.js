"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var https = __importStar(require("https"));
var querystring = __importStar(require("querystring"));
var poly2tri = __importStar(require("poly2tri"));
var environment_1 = __importDefault(require("./environment"));
var POLYGON_THRESHOLD = 0.01;
var POINT_DENSITY = 1000000;
var Triangle = /** @class */ (function () {
    function Triangle(v) {
        this.vertices = v;
        this.area = this.calcArea(this.vertices[0][0], this.vertices[0][1], this.vertices[1][0], this.vertices[1][1], this.vertices[2][0], this.vertices[2][1]);
    }
    Triangle.prototype.calcArea = function (x1, y1, x2, y2, x3, y3) {
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    };
    Triangle.prototype.pointInside = function (point) {
        var A = [];
        for (var i = 0; i < 3; i++) {
            A[i + 1] = this.calcArea(this.vertices[i][0], this.vertices[i][1], this.vertices[(i + 1) % 3][0], this.vertices[(i + 1) % 3][1], point[0], point[1]);
        }
        // Equal within 0.0000001?
        return Math.abs(this.area - (A[1] + A[2] + A[3])) < 0.0000001;
    };
    Triangle.prototype.getRandomPoints = function () {
        var numPoints = this.area * POINT_DENSITY;
        var points = [];
        var verts = this.vertices;
        while (points.length <= numPoints) {
            var v1 = [verts[1][0] - verts[0][0], verts[1][1] - verts[0][1]];
            var v2 = [verts[2][0] - verts[0][0], verts[2][1] - verts[0][1]];
            var a = Math.random();
            var b = Math.random();
            var p = [verts[0][0] + v1[0] * a + v2[0] * b, verts[0][1] + v1[1] * a + v2[1] * b];
            if (this.pointInside(p)) {
                points.push(p);
            }
        }
        return points;
    };
    return Triangle;
}());
function getStartingData() {
    var data;
    try {
        data = require('./test_data.json');
        return data;
    }
    catch (err) {
        console.error('Invalid starting data');
    }
    return null;
}
var getOpenStreetMapData = function (map) {
    return new Promise(function (resolve, reject) {
        var params = {
            city: map.city,
            state: map.state,
            country: map.country,
            polygon_geojson: 1,
            format: "jsonv2",
            polygon_threshold: POLYGON_THRESHOLD
        };
        var options = {
            hostname: "nominatim.openstreetmap.org",
            path: "/search.php?" + querystring.stringify(params),
            method: "POST",
            headers: {
                'User-Agent': environment_1.default.user_agent
            }
        };
        var req = https.request(options, function (res) {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            var jsonString = '';
            res.on('data', function (data) {
                data = data.toJSON();
                for (var i = 0; i < data.data.length; i++) {
                    jsonString += String.fromCharCode(data.data[i]);
                }
            });
            res.on('close', function () {
                var result = JSON.parse(jsonString)[0];
                resolve(result);
            });
        });
        req.on('error', function (error) {
            console.error("ERROR:", error);
            reject(error);
        });
        req.end();
    });
};
function triangulate(coordinates) {
    var triangles = [];
    var polygon = [];
    // Set initial polygon for(let a = 0; a < coordinates[0].length; a++) {
    for (var a = 1; a < coordinates[0].length; a++) {
        var x = coordinates[0][a][0];
        var y = coordinates[0][a][1];
        console.log("New Point: {x: " + x + ", y: " + y + "}");
        polygon.push(new poly2tri.Point(x, y));
    }
    var swctx = new poly2tri.SweepContext(polygon);
    // Set following polygons as holes
    for (var a = 1; a < coordinates.length; a++) {
        // Adjust holes using amount from original adjustment
        var hole = [];
        for (var b = 1; b < coordinates[a].length; b++) {
            var x = coordinates[a][b][0];
            var y = coordinates[a][b][1];
            console.log("New Point: {x: " + x + ", y: " + y + "}");
            hole.push(new poly2tri.Point(x, y));
        }
        swctx.addHole(hole);
    }
    swctx.triangulate();
    swctx.getTriangles().forEach(function (tri, ind) {
        var points = [];
        // Convert from poly2tri.Point type to number[][]
        // and push to points array
        tri.getPoints().forEach(function (p) { points.push([p.x, p.y]); });
        // Correct adjusted points and add them to the triangles array
        triangles[ind] = points;
    });
    return triangles;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var maps, i;
        return __generator(this, function (_a) {
            maps = getStartingData();
            if (!maps)
                return [2 /*return*/, null];
            for (i = 0; i < maps.length; i++) {
                getOpenStreetMapData(maps[i]).then(function (openData) {
                    var rand_points = [];
                    var triangles = [];
                    if (openData.geojson.type === 'MultiPolygon') {
                        var coordinates = openData.geojson.coordinates;
                        coordinates.forEach(function (poly) {
                            triangles.push.apply(triangles, triangulate(poly));
                        });
                    }
                    else if (openData.geojson.type === 'Polygon') {
                        var coordinates = openData.geojson.coordinates;
                        triangles = triangulate(coordinates);
                    }
                    triangles.forEach(function (tri) {
                        var tester = new Triangle(tri);
                        rand_points.push.apply(rand_points, tester.getRandomPoints());
                    });
                    console.log("Number of points calculated: ", rand_points.length);
                }).catch(function (error) {
                    console.log(error);
                });
            }
            return [2 /*return*/];
        });
    });
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
