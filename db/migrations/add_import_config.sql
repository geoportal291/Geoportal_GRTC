-- 1. Añadir columna config_importacion si no existe
ALTER TABLE tipo_ensayo 
ADD COLUMN IF NOT EXISTS config_importacion JSONB DEFAULT '{}';

-- 2. Configurar el mapeo de importación para Granulometría (ID 1)
-- El backend usará este mapa para transformar las claves del Excel ('n4') a las del sistema ('malla_04')
-- y colocarlas en la estructura correcta ('tables.granulometria').
UPDATE tipo_ensayo
SET config_importacion = '{
    "key_map": {
        "n4": "malla_04",
        "n8": "malla_08",
        "n10": "malla_10",
        "n16": "malla_16",
        "n20": "malla_20",
        "n30": "malla_30",
        "n40": "malla_40",
        "n50": "malla_50", 
        "n60": "malla_60",
        "n100": "malla_100",
        "n140": "malla_140",
        "n200": "malla_200",
        "t3": "malla_3p",
        "t2_5": "malla_2p5",
        "t2": "malla_2p",
        "t1_5": "malla_1p5",
        "t1": "malla_1p",
        "t3_4": "malla_3p4",
        "t1_2": "malla_1p2",
        "t3_8": "malla_3p8",
        "t1_4": "malla_1p4",
        "fondo": "pass_200"
    },
    "target_table": "tables.granulometria"
}'::jsonb
WHERE id = 1;

-- 3. Configuración PRECAUTORIA para Límites de Consistencia (ID 2)
-- Actualmente funciona directo porque las claves coinciden, pero dejamos la estructura lista.
-- Al no tener 'key_map' definido, no altera los datos (Pass-through).
UPDATE tipo_ensayo
SET config_importacion = '{
    "key_map": {},
    "target_table": null
}'::jsonb
WHERE id = 2;

-- 4. Configuración para CBR (ID 3)
-- Este mapeo es CRÍTICO para la tabla de Penetración, ya que el sistema necesita distinguir
-- entre los datos del Molde 1, Molde 2 y Molde 3.
-- TAREA DEL USUARIO: Reemplazar las claves de la izquierda ("M1_Pen_0.64", etc.) 
-- por los nombres EXACTOS de las columnas en su Excel.
UPDATE tipo_ensayo
SET config_importacion = '{
    "sheets": {
        "CBR Compactacion": {
            "key_map": {
                -- La fecha de compactación se usa también para penetración
                "fecha": ["tables.compactacion.fecha", "tables.penetracion.fecha"]
            }
        },
        "CBR Expansión": {
            "key_map": {
                "fecha": "tables.expansion.fecha",
                "hora": "tables.expansion.hora"
            }
        }
    },
    "key_map": {
        
        -- === COMPACTACIÓN (Globales únicos) ===
        "nºmolde(m1)": "tables.compactacion.m1_molde",
        "nºmolde(m2)": "tables.compactacion.m2_molde",
        "nºmolde(m3)": "tables.compactacion.m3_molde",

        -- Molde 1 (Compactación)
        "p.m.+s.h.(ns)": "tables.compactacion.m1_ns.pm_sh",
        "p.m.+s.h.(s)": "tables.compactacion.m1_s.pm_sh",
        "pesomolde(ns)": "tables.compactacion.m1_ns.pm",
        "pesomolde(s)": "tables.compactacion.m1_s.pm",
        "p.tara(ns)": "tables.compactacion.m1_ns.pt",
        "p.tara(s)": "tables.compactacion.m1_s.pt",
        "p.s.h.+t.(ns)": "tables.compactacion.m1_ns.psh_t",
        "p.s.h.+t.(s)": "tables.compactacion.m1_s.psh_t",
        "p.s.s.+t.(ns)": "tables.compactacion.m1_ns.pss_t",
        "p.s.s.+t.(s)": "tables.compactacion.m1_s.pss_t",
        "%humedad(ns)": "tables.compactacion.m1_ns.humedad",
        "%humedad(s)": "tables.compactacion.m1_s.humedad",
        "densidadseca": "tables.compactacion.m1_ns.densidad_seca",

        -- Molde 2 (Compactación) - Sufijo _1
        "p.m.+s.h.(ns)_1": "tables.compactacion.m2_ns.pm_sh",
        "p.m.+s.h.(s)_1": "tables.compactacion.m2_s.pm_sh",
        "pesomolde(ns)_1": "tables.compactacion.m2_ns.pm",
        "pesomolde(s)_1": "tables.compactacion.m2_s.pm",
        "p.tara(ns)_1": "tables.compactacion.m2_ns.pt",
        "p.tara(s)_1": "tables.compactacion.m2_s.pt",
        "p.s.h.+t.(ns)_1": "tables.compactacion.m2_ns.psh_t",
        "p.s.h.+t.(s)_1": "tables.compactacion.m2_s.psh_t",
        "p.s.s.+t.(ns)_1": "tables.compactacion.m2_ns.pss_t",
        "p.s.s.+t.(s)_1": "tables.compactacion.m2_s.pss_t",

        -- Molde 3 (Compactación) - Sufijo _2
        "p.m.+s.h.(ns)_2": "tables.compactacion.m3_ns.pm_sh",
        "p.m.+s.h.(s)_2": "tables.compactacion.m3_s.pm_sh",
        "pesomolde(ns)_2": "tables.compactacion.m3_ns.pm",
        "pesomolde(s)_2": "tables.compactacion.m3_s.pm",
        "p.tara(ns)_2": "tables.compactacion.m3_ns.pt",
        "p.tara(s)_2": "tables.compactacion.m3_s.pt",
        "p.s.h.+t.(ns)_2": "tables.compactacion.m3_ns.psh_t",
        "p.s.h.+t.(s)_2": "tables.compactacion.m3_s.psh_t",
        "p.s.s.+t.(ns)_2": "tables.compactacion.m3_ns.pss_t",
        "p.s.s.+t.(s)_2": "tables.compactacion.m3_s.pss_t",

        -- === EXPANSIÓN (Globales únicos) ===
        -- 'fecha' y 'hora' movidos a 'sheets.CBR Expansión'

        -- Molde 1 (Expansión)
        "lec0hr": "tables.expansion.m1_mm.lec_0h",
        "lec24hr": "tables.expansion.m1_mm.lec_24h",
        "lec48hr": "tables.expansion.m1_mm.lec_48h",
        "lec72hr": "tables.expansion.m1_mm.lec_72h",
        "lec96hr": "tables.expansion.m1_mm.lec_96h",
        "%exp": "tables.expansion.m1_mm.expansion_porc",

        -- Molde 2 (Expansión) - Sufijo _1
        "lec0hr_1": "tables.expansion.m2_mm.lec_0h",
        "lec24hr_1": "tables.expansion.m2_mm.lec_24h",
        "lec48hr_1": "tables.expansion.m2_mm.lec_48h",
        "lec72hr_1": "tables.expansion.m2_mm.lec_72h",
        "lec96hr_1": "tables.expansion.m2_mm.lec_96h",
        "%exp_1": "tables.expansion.m2_mm.expansion_porc",

        -- Molde 3 (Expansión) - Sufijo _2
        "lec0hr_2": "tables.expansion.m3_mm.lec_0h",
        "lec24hr_2": "tables.expansion.m3_mm.lec_24h",
        "lec48hr_2": "tables.expansion.m3_mm.lec_48h",
        "lec72hr_2": "tables.expansion.m3_mm.lec_72h",
        "lec96hr_2": "tables.expansion.m3_mm.lec_96h",
        "%exp_2": "tables.expansion.m3_mm.expansion_porc",

        -- === PENETRACIÓN (Globales únicos) ===
        -- Molde 1
        "pen0.64mm": "tables.penetracion.m1_kg.p0_64",
        "pen1.27mm": "tables.penetracion.m1_kg.p1_27",
        "pen1.91mm": "tables.penetracion.m1_kg.p1_91",
        "pen2.54mm": "tables.penetracion.m1_kg.p2_54",
        "pen3.18mm": "tables.penetracion.m1_kg.p3_18",
        "pen3.81mm": "tables.penetracion.m1_kg.p3_81",
        "pen5.08mm": "tables.penetracion.m1_kg.p5_08",
        "pen6.35mm": "tables.penetracion.m1_kg.p6_35",
        "pen7.62mm": "tables.penetracion.m1_kg.p7_62",
        "pen10.16mm": "tables.penetracion.m1_kg.p10_16",
        "pen12.70mm": "tables.penetracion.m1_kg.p12_70",

        -- Molde 2
        "pen0.64mm_1": "tables.penetracion.m2_kg.p0_64",
        "pen1.27mm_1": "tables.penetracion.m2_kg.p1_27",
        "pen1.91mm_1": "tables.penetracion.m2_kg.p1_91",
        "pen2.54mm_1": "tables.penetracion.m2_kg.p2_54",
        "pen3.18mm_1": "tables.penetracion.m2_kg.p3_18",
        "pen3.81mm_1": "tables.penetracion.m2_kg.p3_81",
        "pen5.08mm_1": "tables.penetracion.m2_kg.p5_08",
        "pen6.35mm_1": "tables.penetracion.m2_kg.p6_35",
        "pen7.62mm_1": "tables.penetracion.m2_kg.p7_62",
        "pen10.16mm_1": "tables.penetracion.m2_kg.p10_16",
        "pen12.70mm_1": "tables.penetracion.m2_kg.p12_70",

        -- Molde 3
        "pen0.64mm_2": "tables.penetracion.m3_kg.p0_64",
        "pen1.27mm_2": "tables.penetracion.m3_kg.p1_27",
        "pen1.91mm_2": "tables.penetracion.m3_kg.p1_91",
        "pen2.54mm_2": "tables.penetracion.m3_kg.p2_54",
        "pen3.18mm_2": "tables.penetracion.m3_kg.p3_18",
        "pen3.81mm_2": "tables.penetracion.m3_kg.p3_81",
        "pen5.08mm_2": "tables.penetracion.m3_kg.p5_08",
        "pen6.35mm_2": "tables.penetracion.m3_kg.p6_35",
        "pen7.62mm_2": "tables.penetracion.m3_kg.p7_62",
        "pen10.16mm_2": "tables.penetracion.m3_kg.p10_16",
        "pen12.70mm_2": "tables.penetracion.m3_kg.p12_70"
    }
}'::jsonb
WHERE id = 3;
