const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const injectStr = `
app.delete('/api/audit/logs', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        await db.query('DELETE FROM auditoria');
        res.status(200).json({ status: 'ok', message: 'Registros de auditoría limpiados correctamente.' });
    } catch (err) {
        console.error('Error al limpiar logs de auditoría:', err);
        res.status(500).json({ error: 'Error al limpiar logs de auditoría', details: err.message });
    }
});
`;

if (!code.includes("app.delete('/api/audit/logs'")) {
    code = code.replace("app.get('/api/audit/logs'", injectStr + "app.get('/api/audit/logs'");
    fs.writeFileSync('index.js', code);
    console.log('Injected successfully.');
} else {
    console.log('Already exists.');
}
