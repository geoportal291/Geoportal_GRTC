import { utmToWgs84 } from './geoUtils';

describe('Pruebas de Precisión Geodésica UTM → WGS84', () => {
    test('Punto de Control Cusco (Huso 19S)', () => {
        // Coordenada UTM típica en Cusco: Este 177400, Norte 8504000 (Zona 19S)
        const result = utmToWgs84(177400, 8504000, '19S');
        expect(result).not.toBeNull();
        expect(result.lon).toBeCloseTo(-71.96, 1);
        expect(result.lat).toBeCloseTo(-13.52, 1);
    });

    test('Punto Límite de Huso UTM 18S vs 19S', () => {
        const p18 = utmToWgs84(401000, 8500000, '18S');
        const p19 = utmToWgs84(399000, 8500000, '19S');
        expect(p18).not.toBeNull();
        expect(p19).not.toBeNull();
    });

    test('Manejo Defensivo de Coordenadas Nulas o (0,0)', () => {
        const invalid = utmToWgs84(0, 0, '18S', { strict: true });
        expect(invalid).toBeNull();
    });
});
