"use strict";
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
exports.filterPoints = exports.runServer = void 0;
var environment_1 = __importDefault(require("./environment"));
var express_1 = __importDefault(require("express"));
var puppeteer_1 = __importDefault(require("puppeteer"));
var fs_1 = __importDefault(require("fs"));
var body_parser_1 = __importDefault(require("body-parser"));
// Run puppeteer instance to engage with server
function runClient(url) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch({ headless: true })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    page.setDefaultNavigationTimeout(0);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle0' })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error(err_1);
                    throw new Error("Puppeteer could not connect to " + url);
                case 6: return [4 /*yield*/, browser.close()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Serve client the provided HTML 
function runServer(html, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var app, server;
        var _this = this;
        return __generator(this, function (_a) {
            app = express_1.default();
            app.use(body_parser_1.default.urlencoded({ extended: true }));
            // Serve HTML
            app.get('/', function (_, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    res.status(200).send(html);
                    return [2 /*return*/];
                });
            }); });
            // on POST close server and client
            app.post('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    res.status(200).send("Filtering Complete!");
                    server.close();
                    callback(req.body);
                    return [2 /*return*/];
                });
            }); });
            server = app.listen(8080, function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("Server listening on port 8080...");
                            // run client
                            return [4 /*yield*/, runClient("http://localhost:8080")];
                        case 1:
                            // run client
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
exports.runServer = runServer;
// Return the client-template.html with injected API Key and points data.
// client-template.html includes the script to check points against the
// StreetViewService google API
function createHTML(points) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs_1.default.readFile("./client-template.html", "utf-8", function (err, data) {
                        if (err) {
                            reject(new Error("Could not read template file"));
                        }
                        // Inject API key and points
                        var html = data.replace("GOOGLE_API_KEY", environment_1.default.google_api_key).replace("POINTS", JSON.stringify(points));
                        resolve(html);
                    });
                })];
        });
    });
}
function filterPoints(points) {
    return __awaiter(this, void 0, void 0, function () {
        var start, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    start = Date.now();
                    return [4 /*yield*/, createHTML(points)];
                case 1:
                    html = _a.sent();
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            runServer(html, function (data, err) {
                                if (err) {
                                    reject(err);
                                }
                                var filtered_points = JSON.parse(data.points);
                                console.log("Reduced " + points.length + " to " + filtered_points.length + " points in " + (Date.now() - start) + "ms");
                                resolve(filtered_points);
                            });
                        })];
            }
        });
    });
}
exports.filterPoints = filterPoints;
