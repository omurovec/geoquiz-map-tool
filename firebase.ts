import * as admin from 'firebase-admin';
import ENV from './environment';

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

const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ENV.firebase_url
});

const db = admin.firestore();
const gamesRef = db.collection("games");

export default async function uploadMap(map: Map) {
    await gamesRef.doc(map.title).set({
        boundary: {
            location: new admin.firestore.GeoPoint(Number(map.boundary.location[0]),
                                                   Number(map.boundary.location[1])),
            radius: map.boundary.radius
        },
        locations: map.locations.map((location) =>
            new admin.firestore.GeoPoint(location[0], location[1])
        ),
        numRounds: map.numRounds,
        plainTitle: map.plainTitle,
        roundTimer: map.roundTimer,
        thumbnail: map.thumbnail,
        title: map.title
    }).then(() => {
        console.log(map.title + " map added successfully");
    }).catch(err => {
        console.log(err);
    });
}
