UPDATE tipo_ensayo
SET
  config_importacion = '{
    "sheets": {
      "Proctor Ensayo": {
        "key_map": {},
        "header_rows": 2
      },
      "Proctor Humedad": {
        "key_map": {},
        "header_rows": 2
      }
    },
    "key_map": {}
  }'::jsonb
WHERE config_key = 'proctor';
