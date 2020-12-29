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
Object.defineProperty(exports, "__esModule", { value: true });
exports.triangulate = exports.Triangle = void 0;
var poly2tri = __importStar(require("poly2tri"));
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
exports.Triangle = Triangle;
function triangulate(coordinates) {
    var triangles = [];
    var polygon = [];
    // Set initial polygon for(let a = 0; a < coordinates[0].length; a++) {
    for (var a = 1; a < coordinates[0].length; a++) {
        var x = coordinates[0][a][0];
        var y = coordinates[0][a][1];
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
exports.triangulate = triangulate;
