const turf = require('@turf/turf');
const { kml } = require('@tmcw/togeojson');
const utm = require('utm');
const { DOMParser } = require('xmldom');

console.log('Turf version:', turf.version || 'unknown');
console.log('KML type:', typeof kml);
console.log('UTM fromLatLon type:', typeof utm.fromLatLon);
console.log('DOMParser type:', typeof DOMParser);
