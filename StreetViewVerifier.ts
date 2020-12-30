import ENV from './environment';
import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';
import bodyParser from 'body-parser';

// Run puppeteer instance to engage with server
async function runClient(url: string): Promise<void>{

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    try {
        await page.goto(url, {waitUntil: 'networkidle0'});
    } catch (err) {
        console.error(err);
        throw new Error(`Puppeteer could not connect to ${url}`);
    }
    await browser.close();
}

// Serve client the provided HTML 
export async function runServer(html: string, callback: (data: string, err?: Error) => void) {

    const app = express();
    let server: any;

    app.use(bodyParser.urlencoded({ extended: true }));

    // Serve HTML
    app.get('/', async (_, res) => {
        res.status(200).send(html);
    });

    // on POST close server and client
    app.post('/', async (req, res) => {
        res.status(200).send("Filtering Complete!");
        server.close();
        callback(req.body);
    });

    server = app.listen(8080, async () => {
        console.log("Server listening on port 8080...");
        // run client
        await runClient("http://localhost:8080");
    });

}

// Return the client-template.html with injected API Key and points data.
// client-template.html includes the script to check points against the
// StreetViewService google API
async function createHTML(points: number[][]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile("./client-template.html", "utf-8", (err, data) => {
            if(err) {
                reject(new Error("Could not read template file"));
            }
            // Inject API key and points
            let html = data.replace("GOOGLE_API_KEY", ENV.google_api_key).replace("POINTS", JSON.stringify(points));
            resolve(html);
        });
    });
}

export async function filterPoints(points: number[][]): Promise<number[][]> {
    const start = Date.now();
    const html = await createHTML(points);
    return new Promise((resolve, reject) => {
        runServer(html, (data: any, err) => {
            if(err) {
                reject(err);
            }
            const filtered_points = JSON.parse(data.points);
            console.log(`Reduced ${points.length} to ${filtered_points.length} points in ${Date.now()-start}ms`);
            resolve(filtered_points);
        });
    });
}
