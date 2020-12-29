import ENV from './environment';
import { Loader } from '@googlemaps/js-api-loader';
import * as jsdom from 'jsdom';

// Must return type any since the google types are loaded
// within the function itself
export async function initStreetViewService(): Promise<any> {
     
    // Init fake dom for google maps API
    const { window } = new jsdom.JSDOM(``, {runScripts: "dangerously", resources: "usable"});
     
    // @ts-ignore: Type does not matter
    global.window = window;
    global.document = window.document

    // Load google maps API
    const loader = new Loader({
        apiKey: ENV.google_api_key,
        version: 'weekly',
        libraries: ['places']
    });

    await loader.load().then(() => {
        console.log("google loaded");
    }).catch(err => {
        console.log(err);
    });

    global.google = global.window.google;

    return new google.maps.StreetViewService();
}
