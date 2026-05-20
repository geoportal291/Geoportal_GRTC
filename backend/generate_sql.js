const fs = require('fs');

const g = fs.readFileSync('config/reportes/granulometria.json', 'utf8');
const l = fs.readFileSync('config/reportes/limites.json', 'utf8');
const c = fs.readFileSync('config/reportes/cbr.json', 'utf8');
const p = fs.readFileSync('config/reportes/proctor.json', 'utf8');

const sql = `
UPDATE tipo_ensayo SET config_reporte_pdf = '${g.replace(/'/g, "''")}' WHERE config_key = 'granulometria';

UPDATE tipo_ensayo SET config_reporte_pdf = '${l.replace(/'/g, "''")}' WHERE config_key = 'limites';

UPDATE tipo_ensayo SET config_reporte_pdf = '${c.replace(/'/g, "''")}' WHERE config_key = 'cbr';

UPDATE tipo_ensayo SET config_reporte_pdf = '${p.replace(/'/g, "''")}' WHERE config_key = 'proctor';
`;

fs.writeFileSync('update_reportes_pdf.sql', sql);
console.log('SQL generado con éxito.');
console.log('SQL generado con éxito.');
