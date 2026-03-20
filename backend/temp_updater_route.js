const fs = require('fs');

const indexPath = './index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// The previous updater failed to find app.listen because the file uses server.listen

if (!content.includes("/api/clasificar-suelo-nlp")) {
    content = content.replace(
        "server.listen(PORT, '0.0.0.0', () => {",
        `// ==========================================
// RUTA: MOTOR NLP PARA SUELOS
// ==========================================
app.post('/api/clasificar-suelo-nlp', authenticateToken, async (req, res) => {
    try {
        const { texto } = req.body;
        if (!texto) {
            return res.status(400).json({ error: 'Falta el texto a clasificar en el body.' });
        }
        const resultado = await suelosNlpService.clasificarSuelo(texto);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en /api/clasificar-suelo-nlp:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor NLP.' });
    }
});

server.listen(PORT, '0.0.0.0', () => {`
    );
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('index.js updated successfully with NLP ROUTE!');
