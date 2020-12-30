import * as poly2tri from 'poly2tri';

const POINT_DENSITY = 10000;

export class Triangle {
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

export function triangulate(coordinates: number[][][]): number[][][] {
    let triangles: number[][][] = [];
    let polygon = [];

    // Set initial polygon for(let a = 0; a < coordinates[0].length; a++) {
    for(let a = 1; a < coordinates[0].length; a++) {
        let x = coordinates[0][a][0];
        let y = coordinates[0][a][1];
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
