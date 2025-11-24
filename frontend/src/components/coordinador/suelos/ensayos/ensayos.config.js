/**
 * Configuración para la generación dinámica de formularios de ensayos.
 */
export const ensayosConfig = {
    granulometria: {
        title: 'Datos de Granulometría',
        secciones: [
            {
                id: 'granulometria-generales',
                componente_key: 'CamposGenerales',
                fields: [
                    { name: 'pesoTotal', label: 'Peso Total (g)', type: 'number', step: '0.1', required: true },
                    { name: 'antesLavado', label: 'Peso antes del lavado (g)', type: 'number', step: '0.1' },
                    { name: 'despuesLavado', label: 'Peso después del lavado (g)', type: 'number', step: '0.1' },
                ],
            },
            {
                id: 'granulometria-grafico',
                componente_key: 'VisorGraficos',
                config_json: {
                    charts: [
                        {
                            id: 'granulometriaChart',
                            type: 'line',
                            title: 'Curva Granulométrica',
                            data_source: 'granulometria', // Assuming resultados.granulometria holds the data
                            x_axis: {
                                source: 'tamices', // This will use the tamices defined in ensayosConfig
                                field: 'mm', // Use the 'mm' property of tamices as labels
                                label: 'Diámetro (mm)',
                                scale_type: 'logarithmic', // Granulometry charts typically use a logarithmic scale for X-axis
                                reverse: true, // Sieve sizes usually go from large to small
                            },
                            y_axis: {
                                label: '% Pasa',
                                scale_type: 'linear',
                                min: 0,
                                max: 100,
                            },
                            datasets: [
                                {
                                    label: '% Pasa',
                                    data_field: 'porcentajePasa', // Assuming resultados.granulometria.porcentajePasa
                                    borderColor: '#007bff',
                                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                                    fill: false,
                                    pointRadius: 3,
                                    pointHoverRadius: 5,
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    },
    tamices: {
        title: 'GRANULOMETRIA',
        sieves: [
            { name: '3"', mm: '76.2', key: '3in' },
            { name: '2"', mm: '50.8', key: '2in' },
            { name: '1 1/2"', mm: '38.1', key: '1_5in' },
            { name: '1"', mm: '25.4', key: '1in' },
            { name: '3/4"', mm: '19.1', key: '3_4in' },
            { name: '3/8"', mm: '9.52', key: '3_8in' },
            { name: 'N°4', mm: '4.76', key: 'N4' },
            { name: 'N°10', mm: '2.00', key: 'N10' },
            { name: 'N°20', mm: '0.84', key: 'N20' },
            { name: 'N°40', mm: '0.42', key: 'N40' },
            { name: 'N°60', mm: '0.25', key: 'N60' },
            { name: 'N°140', mm: '0.106', key: 'N140' },
            { name: 'N°200', mm: '0.074', key: 'N200' },
        ]
    },
    limiteLiquido: {
        title: 'Límite Líquido',
        headers: ['Ensayo', 'Nº Golpes', 'Código Recipiente', 'Peso Recip. (g)', 'Recip. + Húmedo (g)', 'Recip. + Seco (g)'],
        tests: [
            {
                id: 1,
                fields: {
                    golpes: { name: 'llGolpes1', type: 'number' },
                    codRecipiente: { name: 'llCodRecipiente1', type: 'text' },
                    pesoRecipiente: { name: 'llPesoRecipiente1', type: 'number', step: '0.01' },
                    pesoHumedo: { name: 'llPesoHumedo1', type: 'number', step: '0.01' },
                    pesoSeco: { name: 'llPesoSeco1', type: 'number', step: '0.01' },
                }
            },
            {
                id: 2,
                fields: {
                    golpes: { name: 'llGolpes2', type: 'number' },
                    codRecipiente: { name: 'llCodRecipiente2', type: 'text' },
                    pesoRecipiente: { name: 'llPesoRecipiente2', type: 'number', step: '0.01' },
                    pesoHumedo: { name: 'llPesoHumedo2', type: 'number', step: '0.01' },
                    pesoSeco: { name: 'llPesoSeco2', type: 'number', step: '0.01' },
                }
            },
            {
                id: 3,
                fields: {
                    golpes: { name: 'llGolpes3', type: 'number' },
                    codRecipiente: { name: 'llCodRecipiente3', type: 'text' },
                    pesoRecipiente: { name: 'llPesoRecipiente3', type: 'number', step: '0.01' },
                    pesoHumedo: { name: 'llPesoHumedo3', type: 'number', step: '0.01' },
                    pesoSeco: { name: 'llPesoSeco3', type: 'number', step: '0.01' },
                }
            }
        ]
    },
    limitePlastico: {
        title: 'Límite Plástico',
        headers: ['Ensayo', 'Código Recipiente', 'Peso Recip. (g)', 'Recip. + Húmedo (g)', 'Recip. + Seco (g)'],
        tests: [
            {
                id: 1,
                fields: {
                    codRecipiente: { name: 'lpCodRecipiente1', type: 'text' },
                    pesoRecipiente: { name: 'lpPesoRecipiente1', type: 'number', step: '0.01' },
                    pesoHumedo: { name: 'lpPesoHumedo1', type: 'number', step: '0.01' },
                    pesoSeco: { name: 'lpPesoSeco1', type: 'number', step: '0.01' },
                }
            },
            {
                id: 2,
                fields: {
                    codRecipiente: { name: 'lpCodRecipiente2', type: 'text' },
                    pesoRecipiente: { name: 'lpPesoRecipiente2', type: 'number', step: '0.01' },
                    pesoHumedo: { name: 'lpPesoHumedo2', type: 'number', step: '0.01' },
                    pesoSeco: { name: 'lpPesoSeco2', type: 'number', step: '0.01' },
                }
            }
        ]
    }
};