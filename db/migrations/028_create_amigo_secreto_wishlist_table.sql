-- db/migrations/028_create_amigo_secreto_wishlist_table.sql

CREATE TABLE IF NOT EXISTS amigo_secreto_wishlist_items (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuariost(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    url TEXT,
    tags TEXT[],
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE amigo_secreto_wishlist_items IS 'Almacena los deseos de la lista de un usuario para el Amigo Secreto.';
COMMENT ON COLUMN amigo_secreto_wishlist_items.usuario_id IS 'El usuario dueño de este deseo.';
COMMENT ON COLUMN amigo_secreto_wishlist_items.texto IS 'La descripción del deseo.';
COMMENT ON COLUMN amigo_secreto_wishlist_items.url IS 'Un enlace de referencia para el producto.';
COMMENT ON COLUMN amigo_secreto_wishlist_items.tags IS 'Etiquetas como color, talla, etc.';
