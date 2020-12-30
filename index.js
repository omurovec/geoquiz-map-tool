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
var prompt_sync_1 = __importDefault(require("prompt-sync"));
var https = __importStar(require("https"));
var querystring = __importStar(require("querystring"));
var environment_1 = __importDefault(require("./environment"));
var Firebase_1 = __importDefault(require("./Firebase"));
var StreetViewVerifier_1 = require("./StreetViewVerifier");
var Triangulate_1 = require("./Triangulate");
var POLYGON_THRESHOLD = 0.01;
function getStartingData(dataFile) {
    var data;
    try {
        data = require(dataFile);
        return data;
    }
    catch (err) {
        console.error(err);
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
            console.log("OpenData Retrieved");
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var startingData, maps, i, processedMap, prompt, i, publishPrompt;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startingData = getStartingData('./data.json');
                    if (!startingData)
                        return [2 /*return*/, null];
                    maps = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < startingData.length)) return [3 /*break*/, 4];
                    if (!startingData[i].city) return [3 /*break*/, 3];
                    console.log("Processing " + startingData[i].city + "...");
                    return [4 /*yield*/, getOpenStreetMapData(startingData[i])
                            .then(function (openData) { return __awaiter(_this, void 0, void 0, function () {
                            var rand_points, triangles, coordinates, coordinates, _i, triangles_1, tri, tester, points, filtered_points;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        rand_points = [];
                                        triangles = [];
                                        // Triangulate the region
                                        if (openData.geojson.type === 'MultiPolygon') {
                                            coordinates = openData.geojson.coordinates;
                                            coordinates.forEach(function (poly) {
                                                triangles.push.apply(triangles, Triangulate_1.triangulate(poly));
                                            });
                                        }
                                        else if (openData.geojson.type === 'Polygon') {
                                            coordinates = openData.geojson.coordinates;
                                            triangles = Triangulate_1.triangulate(coordinates);
                                        }
                                        // Generate random points in a triangle
                                        for (_i = 0, triangles_1 = triangles; _i < triangles_1.length; _i++) {
                                            tri = triangles_1[_i];
                                            tester = new Triangulate_1.Triangle(tri);
                                            points = tester.getRandomPoints();
                                            rand_points.push.apply(rand_points, points);
                                        }
                                        return [4 /*yield*/, StreetViewVerifier_1.filterPoints(rand_points)];
                                    case 1:
                                        filtered_points = _a.sent();
                                        return [2 /*return*/, { openData: openData, filtered_points: filtered_points }];
                                }
                            });
                        }); }).catch(function (error) {
                            console.log(error);
                        })];
                case 2:
                    processedMap = _a.sent();
                    if (processedMap) {
                        maps.push({
                            boundary: {
                                location: [
                                    processedMap.openData.lat,
                                    processedMap.openData.lon
                                ],
                                radius: Math.max(Math.abs(Number(processedMap.openData.boundingbox[1]) -
                                    Number(processedMap.openData.boundingbox[0])), Math.abs(Number(processedMap.openData.boundingbox[3]) -
                                    Number(processedMap.openData.boundingbox[2])))
                            },
                            locations: processedMap.filtered_points,
                            numRounds: startingData[i].numRounds,
                            roundTimer: startingData[i].roundTimer,
                            thumbnail: startingData[i].thumbnail,
                            title: processedMap.openData.display_name.split(',')[0],
                            plainTitle: processedMap.openData.display_name.split(',')[0].toLowerCase()
                        });
                    }
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    prompt = prompt_sync_1.default();
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < maps.length)) return [3 /*break*/, 9];
                    console.log("Title: " + maps[i].title);
                    console.log("Number of Points: " + maps[i].locations.length);
                    console.log("Num Rounds " + maps[i].numRounds);
                    console.log("Round Timer " + maps[i].roundTimer);
                    publishPrompt = prompt("confirm an publish? (Y/n): ");
                    if (!(publishPrompt === "Y")) return [3 /*break*/, 7];
                    return [4 /*yield*/, Firebase_1.default(maps[i])];
                case 6:
                    _a.sent();
                    console.log("Uploaded");
                    return [3 /*break*/, 8];
                case 7:
                    console.log("Skipped map");
                    _a.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 5];
                case 9: return [2 /*return*/];
            }
        });
    });
}
main().then(function () {
    process.exit();
});
