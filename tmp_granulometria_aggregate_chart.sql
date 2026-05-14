UPDATE tipo_ensayo
SET config_graficos =
  CASE
    WHEN jsonb_typeof(config_graficos) = 'array' THEN
      jsonb_build_object(
        'charts', config_graficos,
        'aggregate_charts', jsonb_build_array(
          jsonb_build_object(
            'id', 'granulometria_tendencia',
            'scope', 'group',
            'type', 'line',
            'title', 'Tendencia Granulométrica',
            'height', 360,
            'show_legend', true,
            'legend_mode', 'curves_points_toggle',
            'x_axis', jsonb_build_object(
              'key', 'mm',
              'type', 'logarithmic',
              'label', 'Abertura del tamiz (mm)',
              'reverse', true
            ),
            'y_axis', jsonb_build_object(
              'key', 'porc_pasa',
              'type', 'linear',
              'label', '% que pasa',
              'min', 0,
              'max', 100
            ),
            'datasets', jsonb_build_array(
              jsonb_build_object(
                'label', 'Curvas granulométricas',
                'showLine', true,
                'pointRadius', 3,
                'pointHoverRadius', 6,
                'borderWidth', 1.6,
                'tension', 0,
                'borderColor', '#2563eb',
                'backgroundColor', 'rgba(37, 99, 235, 0.34)',
                'skip_zero_y', true,
                'source', jsonb_build_object(
                  'type', 'group_table_rows',
                  'table_key', 'granulometria',
                  'exclude_keys', jsonb_build_array('fondo', 'total', 'pass_200'),
                  'series_by', 'ensayo'
                ),
                'x_key', 'mm',
                'y_key', 'results.granulometria.pasa.{row_key}',
                'y_keys', jsonb_build_array(
                  'granulometria.pasa.{row_key}',
                  'tables.granulometria.{row_key}.pasa',
                  'tables.granulometria.{row_key}.porc_pasa',
                  'results.tables.granulometria.{row_key}.pasa',
                  'results.tables.granulometria.{row_key}.porc_pasa'
                )
              )
            )
          )
        )
      )
    WHEN jsonb_typeof(config_graficos) = 'object' THEN
      jsonb_set(
        config_graficos,
        '{aggregate_charts}',
        jsonb_build_array(
          jsonb_build_object(
            'id', 'granulometria_tendencia',
            'scope', 'group',
            'type', 'line',
            'title', 'Tendencia Granulométrica',
            'height', 360,
            'show_legend', true,
            'legend_mode', 'curves_points_toggle',
            'x_axis', jsonb_build_object(
              'key', 'mm',
              'type', 'logarithmic',
              'label', 'Abertura del tamiz (mm)',
              'reverse', true
            ),
            'y_axis', jsonb_build_object(
              'key', 'porc_pasa',
              'type', 'linear',
              'label', '% que pasa',
              'min', 0,
              'max', 100
            ),
            'datasets', jsonb_build_array(
              jsonb_build_object(
                'label', 'Curvas granulométricas',
                'showLine', true,
                'pointRadius', 3,
                'pointHoverRadius', 6,
                'borderWidth', 1.6,
                'tension', 0,
                'borderColor', '#2563eb',
                'backgroundColor', 'rgba(37, 99, 235, 0.34)',
                'skip_zero_y', true,
                'source', jsonb_build_object(
                  'type', 'group_table_rows',
                  'table_key', 'granulometria',
                  'exclude_keys', jsonb_build_array('fondo', 'total', 'pass_200'),
                  'series_by', 'ensayo'
                ),
                'x_key', 'mm',
                'y_key', 'results.granulometria.pasa.{row_key}',
                'y_keys', jsonb_build_array(
                  'granulometria.pasa.{row_key}',
                  'tables.granulometria.{row_key}.pasa',
                  'tables.granulometria.{row_key}.porc_pasa',
                  'results.tables.granulometria.{row_key}.pasa',
                  'results.tables.granulometria.{row_key}.porc_pasa'
                )
              )
            )
          )
        ),
        true
      )
    ELSE config_graficos
  END
WHERE config_key = 'granulometria';
