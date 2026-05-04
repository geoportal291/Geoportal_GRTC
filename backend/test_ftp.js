const ftp = require('basic-ftp');

async function testFTP() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Conectando...");
        await client.access({
            host: "files.dafe.it.com",
            user: "geoportal",
            password: "admin123",
            port: 21,
            secure: false
        });
        console.log("Conectado con éxito.");
        await client.ensureDir("/Web/geoportal/test_dir");
        console.log("Directorio creado o verificado con éxito.");
    } catch (err) {
        console.error("Error de FTP:", err);
    } finally {
        client.close();
    }
}

testFTP();
