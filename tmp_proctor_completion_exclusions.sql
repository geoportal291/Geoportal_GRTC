UPDATE tipo_ensayo
SET config_tabla = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            config_tabla,
                            '{general_fields,0,exclude_from_completion}',
                            'true'::jsonb,
                            true
                        ),
                        '{general_fields,1,exclude_from_completion}',
                        'true'::jsonb,
                        true
                    ),
                    '{general_fields,2,exclude_from_completion}',
                    'true'::jsonb,
                    true
                ),
                '{general_fields,3,exclude_from_completion}',
                'true'::jsonb,
                true
            ),
            '{general_fields,4,exclude_from_completion}',
            'true'::jsonb,
            true
        ),
        '{general_fields,5,exclude_from_completion}',
        'true'::jsonb,
        true
    ),
    '{general_fields,6,exclude_from_completion}',
    'true'::jsonb,
    true
)
WHERE config_key = 'proctor';
