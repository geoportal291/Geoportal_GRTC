
// NEW: Ruta para obtener un proyecto por ID
app.get('/api/proyectos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const project = await proyectosService.getProyectoById(id);
        if (project) {
            res.json(project);
        } else {
            res.status(404).json({ error: 'Proyecto no encontrado' });
        }
    } catch (err) {
        console.error(`Error al obtener proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener el proyecto', details: err.message });
    }
});
