-- ============================================================
-- Migración 051 — Carta de Plasticidad en la web (límites)
-- Fecha: 2026-09-15
-- Propósito: añadir al config_graficos de Límites el gráfico
--   "Carta de Plasticidad" con la línea A (0.73*(LL-20)), la línea U
--   (0.9*(LL-8)) y el punto de la muestra (LL, IP leídos de
--   calculated_values.finales). Renderizado por VisorGraficos
--   (soporta puntos estáticos inline). Idempotente: no duplica si ya
--   existe un chart con id 'carta_plasticidad'.
-- ============================================================

UPDATE tipo_ensayo
SET config_graficos = jsonb_set(
    config_graficos,
    '{charts}',
    (config_graficos->'charts') || '[
  {
    "id": "carta_plasticidad",
    "type": "line",
    "title": "Carta de Plasticidad (Casagrande)",
    "height": 380,
    "x_axis": {"label": "Límite Líquido L.L. (%)", "type": "linear", "min": 0, "max": 100},
    "y_axis": {"label": "Índice de Plasticidad I.P. (%)", "type": "linear", "min": 0, "max": 60},
    "datasets": [
      {
        "id": "linea_a",
        "label": "Línea A (I.P. = 0.73·(L.L.-20))",
        "showLine": true,
        "pointRadius": 0,
        "borderWidth": 2,
        "borderColor": "#dc2626",
        "points": [
          {"x": 20, "y": 0}, {"x": 30, "y": 7.3}, {"x": 40, "y": 14.6},
          {"x": 50, "y": 21.9}, {"x": 60, "y": 29.2}, {"x": 70, "y": 36.5},
          {"x": 80, "y": 43.8}, {"x": 90, "y": 51.1}, {"x": 100, "y": 58.4}
        ]
      },
      {
        "id": "linea_u",
        "label": "Línea U (I.P. = 0.9·(L.L.-8))",
        "showLine": true,
        "pointRadius": 0,
        "borderWidth": 1.5,
        "borderDash": [6, 4],
        "borderColor": "#64748b",
        "points": [
          {"x": 16, "y": 7.2}, {"x": 25.3, "y": 15.6}, {"x": 40, "y": 28.8},
          {"x": 55, "y": 42.3}, {"x": 73.9, "y": 59.3}
        ]
      },
      {
        "id": "muestra",
        "label": "Muestra",
        "showLine": false,
        "pointRadius": 7,
        "backgroundColor": "#1e40af",
        "x_key": "calculated_values.finales.limite_liquido",
        "y_key": "calculated_values.finales.indice_plasticidad",
        "skip_zero_x": true
      }
    ]
  }
]'::jsonb
)
WHERE config_key = 'limites'
  AND jsonb_typeof(config_graficos->'charts') = 'array'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(config_graficos->'charts') c
    WHERE c->>'id' = 'carta_plasticidad'
  );
