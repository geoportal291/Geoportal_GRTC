-- CORRECCIÓN PARA LA CONFIGURACIÓN DE LA TABLA DE GRANULOMETRÍA

UPDATE tipo_ensayo
SET config_tabla = $$
{
  "granulometria": {
    "headers": [{"key": "tamiz", "label": "Tamiz", "type": "static"}, {"key": "mm", "label": "mm", "type": "static"}, {"key": "retenido", "label": "Peso Retenido (g)", "type": "input"}, {"key": "porc_retenido", "label": "% Ret.", "type": "calculated"}, {"key": "porc_acum", "label": "% Acum.", "type": "calculated"}, {"key": "porc_pasa", "label": "% Pasa", "type": "calculated"}],
    "rows": [
      {"tamiz": "3\"", "mm": 75.0, "key": "t3"},
      {"tamiz": "2 1/2\"", "mm": 63.0, "key": "t2_5"},
      {"tamiz": "2\"", "mm": 50.0, "key": "t2"},
      {"tamiz": "1 1/2\"", "mm": 37.5, "key": "t1_5"},
      {"tamiz": "1\"", "mm": 25.0, "key": "t1"},
      {"tamiz": "3/4\"", "mm": 19.0, "key": "t3_4"},
      {"tamiz": "1/2\"", "mm": 12.5, "key": "t1_2"},
      {"tamiz": "3/8\"", "mm": 9.5, "key": "t3_8"},
      {"tamiz": "N° 4", "mm": 4.75, "key": "n4"},
      {"tamiz": "N° 10", "mm": 2.0, "key": "n10"},
      {"tamiz": "N° 20", "mm": 0.85, "key": "n20"},
      {"tamiz": "N° 40", "mm": 0.425, "key": "n40"},
      {"tamiz": "N° 60", "mm": 0.25, "key": "n60"},
      {"tamiz": "N° 100", "mm": 0.15, "key": "n100"},
      {"tamiz": "N° 200", "mm": 0.075, "key": "n200"},
      {"tamiz": "Fondo", "mm": null, "key": "fondo"}
    ]
  }
}
$$::jsonb
WHERE id = 1; -- Actualizando por ID numérico para Granulometría
