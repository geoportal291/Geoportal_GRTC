const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'capturas', 'import_progresivas.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('Nombres de las hojas encontradas en el archivo:');
    console.log(JSON.stringify(sheetNames, null, 2));

} catch (error) {
    console.error('Error al procesar el archivo Excel:', error.message);
    process.exit(1);
}