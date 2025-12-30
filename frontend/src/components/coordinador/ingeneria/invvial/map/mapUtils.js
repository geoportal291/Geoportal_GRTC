import alertify from 'alertifyjs';

/**
 * Fetches nearby cities, towns, and villages from OpenStreetMap using the Overpass API.
 * 
 * @param {L.LatLngBounds} bounds - Leaflet LatLngBounds object defining the search area.
 * @returns {Promise<Array>} - Promise resolving to an array of place objects { lat, lng, name, type, population }.
 */
export const fetchNearbyPlaces = async (bounds) => {
    if (!bounds || !bounds.isValid()) {
        console.warn("Invalid bounds provided to fetchNearbyPlaces");
        return [];
    }

    // OPTIMIZED BOUNDS: Prevent searching entire continents.
    // If the box is too big (> 0.5 deg), we clamp it to the center 0.5 deg.
    // This ensures that even at Zoom 4, we find cities *in the center of the view* without crashing the API.
    const MAX_DELTA = 0.5; // Approx 55km
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();

    let qSouth = south, qWest = west, qNorth = north, qEast = east;

    if ((north - south) > MAX_DELTA || (east - west) > MAX_DELTA) {
        const centerLat = (north + south) / 2;
        const centerLng = (east + west) / 2;
        qSouth = centerLat - (MAX_DELTA / 2);
        qNorth = centerLat + (MAX_DELTA / 2);
        qWest = centerLng - (MAX_DELTA / 2);
        qEast = centerLng + (MAX_DELTA / 2);
        // console.warn("Clamping Overpass bounds to prevent timeout:", { qSouth, qWest, qNorth, qEast });
    }

    // OPTIMIZED QUERY: Restrict to 'node' only to prevent 504 Gateway Timeouts.
    // 'way' and 'relation' queries are too expensive.
    // OPTIMIZED QUERY: Restrict to 'node' only to prevent 504 Gateway Timeouts.
    // 'way' and 'relation' queries are too expensive.
    const query = `
        [out:json][timeout:25];
        (
          node["place"~"city|town|village|hamlet|isolated_dwelling|locality"](${qSouth},${qWest},${qNorth},${qEast});
        );
        out body;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.elements) {
            return [];
        }

        const places = data.elements.map(element => {
            // Handle 'out center' format where lat/lon might be in 'center' object for ways/relations
            const lat = element.lat || (element.center && element.center.lat);
            const lng = element.lon || (element.center && element.center.lon);

            if (!lat || !lng) return null; // Skip if no coordinates found

            return {
                lat: lat,
                lng: lng,
                name: element.tags.name || 'Lugar Sin Nombre',
                type: element.tags.place,
                population: element.tags.population,
                desc: element.tags.place ? `Tipo: ${element.tags.place}${element.tags.population ? `, Pob: ${element.tags.population}` : ''}` : ''
            };
        }).filter(p => p !== null); // Filter out invalid entries

        // Filter out very small places if we have too many? 
        // For now, return all found in the view.
        return places;

    } catch (error) {
        console.error("Error fetching nearby places:", error);
        // alertify.error("No se pudieron cargar ciudades cercanas (Overpass API).");
        return [];
    }
};
