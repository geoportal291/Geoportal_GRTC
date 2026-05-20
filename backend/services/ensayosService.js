const db = require('../conexion');
const XLSX = require('xlsx');

// --- UTILIDADES ---

const normalizeKeyForExport = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^\w\s]/g, '')
        .trim();
};

const formatProgresivaForExport = (codigo) => {
    if (!codigo) return '';
    if (typeof codigo !== 'string') return codigo;
    if (!codigo.includes('-')) return codigo;
    const parts = codigo.split('-');
    return `0+${parts[1]}`;
};

const formatDateForExport = (value) => {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('es-PE');
};

const extractCodigoFromNombreEnsayo = (nombreEnsayo) => {
    if (!nombreEnsayo) return '';
    const raw = String(nombreEnsayo).trim();
    if (!raw) return '';

    const importadoMatch = raw.match(/^Importado\s*\((.+)\)$/i);
    if (importadoMatch?.[1]) return importadoMatch[1].trim();

    return raw;
};

const normalizeAlphaNumericCode = (value, fallback = '') => {
    const normalized = String(value || fallback || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    return normalized || fallback;
};

const normalizeNumericCodeSegment = (value, length) => {
    const raw = String(value ?? '').trim();
    const afterDash = raw.includes('-') ? raw.split('-').pop() : raw;
    const digits = afterDash.replace(/\D/g, '');
    return digits.padStart(length, '0').slice(-length);
};

const inferCorrelativoFromCodigo = (codigo) => {
    const raw = String(codigo || '').trim();
    if (raw.length < 3) return null;
    const suffix = raw.slice(-3);
    return /^\d{3}$/.test(suffix) ? Number(suffix) : null;
};

const deepMergeObjects = (target = {}, source = {}) => {
    const output = Array.isArray(target) ? [...target] : { ...target };

    Object.entries(source || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            output[key] = [...value];
            return;
        }

        if (value && typeof value === 'object') {
            const currentValue = output[key];
            output[key] = deepMergeObjects(
                currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue) ? currentValue : {},
                value
            );
            return;
        }

        output[key] = value;
    });

    return output;
};

const deepMergeForExport = (base = {}, incoming = {}) => {
    const output = Array.isArray(base) ? [...base] : { ...base };

    Object.entries(incoming || {}).forEach(([key, value]) => {
        const currentValue = output[key];

        if (Array.isArray(value)) {
            output[key] = [...value];
            return;
        }

        if (value && typeof value === 'object') {
            output[key] = deepMergeForExport(
                currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue) ? currentValue : {},
                value
            );
            return;
        }

        const isIncomingEmpty = value === '' || value === null || value === undefined;
        const hasCurrentValue = currentValue !== '' && currentValue !== null && currentValue !== undefined;

        if (isIncomingEmpty && hasCurrentValue) {
            return;
        }

        output[key] = value;
    });

    return output;
};

const hasMeaningfulValue = (value) =>
    value !== undefined && value !== null && value !== '';

const normalizeCompletionPath = (path, scope = 'general_fields') => {
    if (!path) return '';
    const normalized = String(path);
    return normalized.includes('.') ? normalized : `${scope}.${normalized}`;
};

const collectCompletionExcludedPaths = (tableConfig) => {
    const excluded = new Set();

    const collect = (fields = [], scope = 'general_fields') => {
        fields.forEach((field) => {
            const shouldExclude =
                field?.exclude_from_completion === true
                || field?.input_config?.exclude_from_completion === true;

            if (!shouldExclude) return;
            excluded.add(normalizeCompletionPath(field.path || field.key, scope));
        });
    };

    if (Array.isArray(tableConfig?.general_fields)) {
        collect(tableConfig.general_fields, 'general_fields');
    }

    if (Array.isArray(tableConfig?.fields)) {
        collect(tableConfig.fields, 'fields');
    }

    return excluded;
};

const hasMeaningfulLeafValue = (value, excludedPaths, currentPath = '') => {
    if (!hasMeaningfulValue(value)) return false;
    if (excludedPaths.has(currentPath)) return false;

    if (Array.isArray(value)) {
        return value.some((item, index) =>
            hasMeaningfulLeafValue(item, excludedPaths, `${currentPath}.${index}`));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value).some(([key, child]) => {
            const childPath = currentPath ? `${currentPath}.${key}` : key;
            return hasMeaningfulLeafValue(child, excludedPaths, childPath);
        });
    }

    return true;
};

const hasMeaningfulFormData = (formData, tableConfig) => {
    if (!formData || typeof formData !== 'object') return false;
    const excludedPaths = collectCompletionExcludedPaths(tableConfig);
    return hasMeaningfulLeafValue(formData, excludedPaths, '');
};

const getTipoEnsayoTableConfig = async (tipoEnsayoId, pool = db) => {
    if (!tipoEnsayoId) return null;

    const result = await pool.query(
        'SELECT config_tabla FROM tipo_ensayo WHERE id = $1',
        [tipoEnsayoId]
    );

    return result.rows[0]?.config_tabla || null;
};

const normalizeIdentificadorInput = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
};

const getNextCorrelativoByTipo = async (tipoEnsayoId, ensayoId, pool = db) => {
    const result = await pool.query(`
        SELECT COALESCE(MAX(correlativo_tipo_ensayo), 0) + 1 AS next_correlativo
        FROM ensayos
        WHERE tipo_ensayo = $1
          AND ($2::int IS NULL OR id <> $2)
    `, [tipoEnsayoId, ensayoId || null]);

    return Number(result.rows[0]?.next_correlativo || 1);
};

const getNextIdentificadorByContext = async (estratoId, tipoEnsayoId, ensayoId = null, pool = db) => {
    const result = await pool.query(`
        SELECT identificador
        FROM ensayos
        WHERE estrato_id = $1
          AND tipo_ensayo = $2
          AND ($3::int IS NULL OR id <> $3)
          AND identificador IS NOT NULL
          AND BTRIM(identificador) <> ''
    `, [estratoId, tipoEnsayoId, ensayoId]);

    let maxNumericIdentifier = 0;

    result.rows.forEach((row) => {
        const raw = String(row.identificador || '').trim();
        if (!/^\d+$/.test(raw)) return;
        const numericValue = Number(raw);
        if (Number.isFinite(numericValue) && numericValue > maxNumericIdentifier) {
            maxNumericIdentifier = numericValue;
        }
    });

    return String(maxNumericIdentifier + 1);
};

const buildCodigoEnsayo = ({
    proyectoCodigo,
    tramoCodigo,
    managerTypeCode,
    progresivaCodigo,
    estratoOrden,
    tipoEnsayoCodigo,
    correlativo
}) => {
    return [
        normalizeAlphaNumericCode(proyectoCodigo, 'CU'),
        normalizeNumericCodeSegment(tramoCodigo, 3),
        String(managerTypeCode || 1),
        normalizeNumericCodeSegment(progresivaCodigo, 5),
        String(estratoOrden ?? 0).padStart(1, '0').slice(-1),
        String(tipoEnsayoCodigo ?? 0).padStart(2, '0').slice(-2),
        String(correlativo ?? 1).padStart(3, '0').slice(-3)
    ].join('');
};

const resolveEnsayoCodeContext = async (estratoId, tipoEnsayoId, pool = db) => {
    const result = await pool.query(`
        SELECT
            est.id AS estrato_id,
            est.parent_type,
            est.parent_id,
            est.orden AS estrato_orden,
            te.id AS tipo_ensayo_id,
            te.codigo AS tipo_ensayo_codigo,
            prog.id AS progresiva_id,
            prog.codigo AS progresiva_codigo,
            prog.tipo_via AS progresiva_tipo_via,
            prog.parent_id AS tramo_id,
            tramo.codigo AS tramo_codigo,
            tramo.proyecto_id AS tramo_proyecto_id,
            can.id AS cantera_id,
            can.codigo AS cantera_codigo,
            can.id_proyecto AS cantera_proyecto_id,
            can.tramo_id AS cantera_tramo_id,
            pref.id AS progresiva_referencia_id,
            pref.codigo AS progresiva_referencia_codigo,
            tramo_can.codigo AS cantera_tramo_codigo,
            proy.id AS proyecto_id,
            proy.codigo AS proyecto_codigo
        FROM estratos est
        JOIN tipo_ensayo te ON te.id = $2
        LEFT JOIN progresivas prog
            ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
        LEFT JOIN progresivas tramo
            ON est.parent_type = 'progresiva' AND prog.parent_id = tramo.id
        LEFT JOIN canteras can
            ON est.parent_type = 'cantera' AND est.parent_id = can.id
        LEFT JOIN progresivas pref
            ON est.parent_type = 'cantera' AND can.id_progresiva_referencia = pref.id
        LEFT JOIN progresivas tramo_can
            ON est.parent_type = 'cantera' AND can.tramo_id = tramo_can.id
        LEFT JOIN proyectos proy
            ON proy.id = COALESCE(
                prog.proyecto_id,
                tramo.proyecto_id,
                can.id_proyecto,
                tramo_can.proyecto_id
            )
        WHERE est.id = $1
    `, [estratoId, tipoEnsayoId]);

    return result.rows[0] || null;
};

const buildDerivedEnsayoFields = async ({
    ensayoId = null,
    estratoId,
    tipoEnsayoId,
    existingCodigoEnsayo = null,
    existingCorrelativo = null
}, pool = db) => {
    if (!estratoId || !tipoEnsayoId) return null;

    const context = await resolveEnsayoCodeContext(estratoId, tipoEnsayoId, pool);
    if (!context) return null;

    const managerTypeCode = context.parent_type === 'cantera' ? 2 : 1;
    const progresivaId = context.parent_type === 'progresiva'
        ? context.progresiva_id
        : (context.progresiva_referencia_id || null);
    const progresivaCodigo = context.parent_type === 'progresiva'
        ? context.progresiva_codigo
        : (context.progresiva_referencia_codigo || context.cantera_codigo);
    const tramoCodigo = context.parent_type === 'progresiva'
        ? context.tramo_codigo
        : context.cantera_tramo_codigo;

    const correlativo =
        Number(existingCorrelativo)
        || inferCorrelativoFromCodigo(existingCodigoEnsayo)
        || await getNextCorrelativoByTipo(tipoEnsayoId, ensayoId, pool);

    const codigoEnsayo = existingCodigoEnsayo || buildCodigoEnsayo({
        proyectoCodigo: context.proyecto_codigo,
        tramoCodigo,
        managerTypeCode,
        progresivaCodigo,
        estratoOrden: context.estrato_orden,
        tipoEnsayoCodigo: context.tipo_ensayo_codigo,
        correlativo
    });

    return {
        proyecto_id: context.proyecto_id || null,
        progresiva: progresivaId || null,
        codigo_tramo: Number(normalizeNumericCodeSegment(tramoCodigo, 3)) || null,
        tipo_via: context.progresiva_tipo_via || null,
        tipo_ensayo_codigo: context.tipo_ensayo_codigo || null,
        correlativo_tipo_ensayo: correlativo,
        codigo_generado: codigoEnsayo,
        codigo_ensayo: codigoEnsayo
    };
};

const ensureEnsayoDerivedFields = async (ensayo, pool = db) => {
    if (!ensayo?.estrato_id || !ensayo?.tipo_ensayo) return ensayo;

    const needsBackfill =
        !ensayo.codigo_ensayo ||
        !ensayo.proyecto_id ||
        !ensayo.progresiva ||
        !ensayo.codigo_tramo ||
        !ensayo.tipo_ensayo_codigo ||
        !ensayo.correlativo_tipo_ensayo;

    if (!needsBackfill) return ensayo;

    const derived = await buildDerivedEnsayoFields({
        ensayoId: ensayo.id,
        estratoId: ensayo.estrato_id,
        tipoEnsayoId: ensayo.tipo_ensayo,
        existingCodigoEnsayo: ensayo.codigo_ensayo,
        existingCorrelativo: ensayo.correlativo_tipo_ensayo
    }, pool);

    if (!derived) return ensayo;

    const result = await pool.query(`
        UPDATE ensayos
        SET
            proyecto_id = COALESCE($1, proyecto_id),
            progresiva = COALESCE($2, progresiva),
            codigo_tramo = COALESCE($3, codigo_tramo),
            tipo_via = COALESCE($4, tipo_via),
            tipo_ensayo_codigo = COALESCE($5, tipo_ensayo_codigo),
            correlativo_tipo_ensayo = COALESCE($6, correlativo_tipo_ensayo),
            codigo_generado = COALESCE($7, codigo_generado),
            codigo_ensayo = COALESCE($8, codigo_ensayo)
        WHERE id = $9
        RETURNING *
    `, [
        derived.proyecto_id,
        derived.progresiva,
        derived.codigo_tramo,
        derived.tipo_via,
        derived.tipo_ensayo_codigo,
        derived.correlativo_tipo_ensayo,
        derived.codigo_generado,
        derived.codigo_ensayo,
        ensayo.id
    ]);

    return { ...ensayo, ...result.rows[0] };
};

const flattenObject = (obj, prefix = '') => {
    if (obj === null || obj === undefined) return {};
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        const value = obj[k];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value, pre + k));
        } else {
            acc[pre + k] = value;
            // Solo crear alias cortos en el nivel raíz para evitar colisiones entre
            // filas/columnas de tablas distintas. Además, no debemos tratar 0/false/''
            // como si el valor "no existiera".
            if (!prefix && acc[k] === undefined) acc[k] = value;
        }
        return acc;
    }, {});
};

const transformEnsayoDataMap = (ensayo) => {
    const data = deepMergeForExport(ensayo.resultado || {}, ensayo.datos_formulario || {});
    const transformed = { ...data };
    if (data.general_fields) Object.assign(transformed, data.general_fields);

    if (data.tables) {
        Object.entries(data.tables).forEach(([tableName, tableRows]) => {
            if (typeof tableRows === 'object' && !Array.isArray(tableRows)) {
                Object.entries(tableRows).forEach(([rowKey, rowData]) => {
                    if (typeof rowData === 'object' && rowData !== null) {
                        Object.entries(rowData).forEach(([fieldKey, val]) => {
                            transformed[`${tableName}.${rowKey}.${fieldKey}`] = val;
                            transformed[`${rowKey}.${fieldKey}`] = val;
                            if (['retenido', 'valor', 'pasa', 'porcentaje'].includes(fieldKey)) {
                                if (transformed[rowKey] === undefined) transformed[rowKey] = val;
                            }
                        });
                    } else {
                        transformed[`${tableName}.${rowKey}`] = rowData;
                        if (transformed[rowKey] === undefined) transformed[rowKey] = rowData;
                    }
                });
            } else if (Array.isArray(tableRows)) {
                tableRows.forEach((row, i) => {
                    transformed[`${tableName}.${i}`] = row;
                    if (typeof row === 'object' && row !== null) {
                        Object.entries(row).forEach(([fKey, val]) => {
                            transformed[`${tableName}.${i}.${fKey}`] = val;
                        });
                    }
                });
            }
        });
    }
    return flattenObject(transformed);
};

const resolveEnsayoIdentifier = (ensayo, flattenedData = {}) => {
    return ensayo.identificador
        || flattenedData['identificador']
        || flattenedData['general_fields.identificador']
        || flattenedData['metadata.identificador']
        || '';
};

const getStandardMetadataHeaders = (isCantera = false) => {
    console.log(`[DEBUG] Generando encabezados estándar. isCantera: ${isCantera}`);
    return [
        { header: 'CÓDIGO ENSAYO', key: 'metadata.codigo_ensayo', width: 20 },
        { header: 'Fecha', key: 'metadata.fecha', width: 15 },
        { header: isCantera ? 'Cantera' : 'Progresiva', key: isCantera ? 'metadata.cantera' : 'metadata.progresiva', width: 20 },
        { header: 'Calicata', key: 'metadata.identificador', width: 15 },
        { header: 'Estrato', key: 'metadata.estrato', width: 10 }
    ];
};

const normalizeConfiguredKey = (rawValue, normalizationConfig = {}) => {
    if (rawValue === null || rawValue === undefined) return '';

    let value = String(rawValue).trim().toLowerCase();
    const simbolos = normalizationConfig.simbolos || {};
    const ignorables = Array.isArray(normalizationConfig.ignorables) ? normalizationConfig.ignorables : [];
    const filtros = Array.isArray(normalizationConfig.filtros) ? normalizationConfig.filtros : [];

    Object.entries(simbolos).forEach(([buscar, reemplazar]) => {
        value = value.split(buscar.toLowerCase()).join(String(reemplazar).toLowerCase());
    });

    filtros.forEach((filtro) => {
        if (!filtro || !filtro.buscar) return;

        try {
            if (filtro.is_regex) {
                value = value.replace(new RegExp(filtro.buscar, 'gi'), filtro.reemplazar || '');
            } else {
                value = value.split(String(filtro.buscar).toLowerCase()).join(String(filtro.reemplazar || '').toLowerCase());
            }
        } catch (_) {
            // Ignorar reglas mal formadas para no romper la exportación.
        }
    });

    ignorables.forEach((token) => {
        if (!token) return;
        value = value.split(String(token).toLowerCase()).join('');
    });

    return value
        .replace(/[()"'`´]/g, '')
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_./+-]/g, '');
};

const resolveAliasWithConfig = (alias, ensayo, tableName = null) => {
    if (!alias) return null;

    const importConfig = ensayo?.config_importacion || {};
    const normalizationConfig = ensayo?.config_normalizacion || {};
    const keyMap = importConfig?.key_map && typeof importConfig.key_map === 'object' ? importConfig.key_map : {};
    const aliasesGenericos = normalizationConfig?.aliases_genericos && typeof normalizationConfig.aliases_genericos === 'object'
        ? normalizationConfig.aliases_genericos
        : {};
    const normalizedAlias = normalizeConfiguredKey(alias, normalizationConfig);

    if (keyMap[alias]) return keyMap[alias];
    if (keyMap[normalizedAlias]) return keyMap[normalizedAlias];

    const normalizedKeyMapEntry = Object.entries(keyMap).find(([sourceKey]) =>
        normalizeConfiguredKey(sourceKey, normalizationConfig) === normalizedAlias
    );
    if (normalizedKeyMapEntry) return normalizedKeyMapEntry[1];

    if (aliasesGenericos[alias]) return aliasesGenericos[alias];
    if (aliasesGenericos[normalizedAlias]) return aliasesGenericos[normalizedAlias];

    const normalizedGenericAlias = Object.entries(aliasesGenericos).find(([sourceKey]) =>
        normalizeConfiguredKey(sourceKey, normalizationConfig) === normalizedAlias
    );
    if (normalizedGenericAlias) return normalizedGenericAlias[1];

    const tables = Array.isArray(ensayo?.config_tabla?.tables) ? ensayo.config_tabla.tables : [];
    const targetTables = tableName ? tables.filter((table) => table?.key === tableName) : tables;

    for (const table of targetTables) {
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const match = rows.find((row) => {
            const baseCandidates = [
                row?.key,
                row?.label,
                row?.import_rules?.source_key,
                ...(Array.isArray(row?.import_rules?.aliases) ? row.import_rules.aliases : [])
            ].filter(Boolean);

            const reverseMappedAliases = Object.entries(keyMap)
                .filter(([, mappedValue]) => mappedValue === row?.key)
                .map(([sourceKey]) => sourceKey);

            const derivedGenericAliases = Object.entries(aliasesGenericos)
                .filter(([sourceKey]) => {
                    const normalizedSource = normalizeConfiguredKey(sourceKey, normalizationConfig);
                    return baseCandidates.some((candidate) =>
                        normalizeConfiguredKey(candidate, normalizationConfig) === normalizedSource
                    );
                })
                .map(([, aliasValue]) => aliasValue);

            const candidates = [
                ...baseCandidates,
                ...reverseMappedAliases,
                ...derivedGenericAliases
            ].filter(Boolean);

            return candidates.some((candidate) => normalizeConfiguredKey(candidate, normalizationConfig) === normalizedAlias);
        });

        if (match?.key) return match.key;
    }

    return null;
};

const remapExportKeyFromConfig = (key, ensayo) => {
    const parts = String(key).split('.');

    if (parts.length >= 4 && parts[0] === 'tables') {
        const tableName = parts[1];
        const alias = parts[2];
        const mapped = resolveAliasWithConfig(alias, ensayo, tableName);
        if (mapped) {
            if (mapped.includes('.')) {
                const suffix = parts.slice(3).join('.');
                return suffix ? `${mapped}.${suffix}` : mapped;
            }
            parts[2] = mapped;
            return parts.join('.');
        }
    }

    if (parts.length >= 2) {
        const leaf = parts[parts.length - 1];
        const mappedLeaf = resolveAliasWithConfig(leaf, ensayo);
        if (mappedLeaf) {
            if (mappedLeaf.includes('.')) return mappedLeaf;
            parts[parts.length - 1] = mappedLeaf;
            return parts.join('.');
        }
    }

    return key;
};

const getConfigTablesList = (configTabla = {}) => {
    if (Array.isArray(configTabla?.tables)) return configTabla.tables;

    if (configTabla?.tables && typeof configTabla.tables === 'object') {
        return Object.entries(configTabla.tables).map(([tableKey, tableConfig]) => ({
            key: tableConfig?.key || tableKey,
            ...tableConfig
        }));
    }

    return [];
};

const getGeneralFieldsList = (configTabla = {}) => {
    if (Array.isArray(configTabla?.general_fields)) return configTabla.general_fields;
    if (Array.isArray(configTabla?.general_fields?.fields)) return configTabla.general_fields.fields;
    return [];
};

const isEditableConfigField = (fieldConfig = {}) => {
    const fieldType = String(fieldConfig?.type || '').toLowerCase();
    return !fieldType || fieldType === 'input' || fieldType === 'text' || fieldType === 'number' || fieldType === 'date';
};

const buildImportablePathsSet = (tipoConfig = {}) => {
    const importablePaths = new Set();
    const configTabla = tipoConfig?.config_tabla || {};
    const generalFields = getGeneralFieldsList(configTabla);
    const tables = getConfigTablesList(configTabla);

    generalFields.forEach((field) => {
        if (!field?.key || !isEditableConfigField(field)) return;
        importablePaths.add(`general_fields.${field.key}`);
    });

    tables.forEach((table) => {
        if (!table?.key) return;

        const rows = Array.isArray(table.rows) ? table.rows : [];
        const headers = Array.isArray(table.headers) ? table.headers : [];

        rows.forEach((row) => {
            if (!row?.key) return;

            headers.forEach((header) => {
                if (!header?.key || !isEditableConfigField(header)) return;
                importablePaths.add(`tables.${table.key}.${row.key}.${header.key}`);
            });
        });
    });

    return importablePaths;
};

const isImportablePath = (path, tipoConfig = {}) => {
    if (!path) return false;
    if (!tipoConfig.__importablePaths) {
        tipoConfig.__importablePaths = buildImportablePathsSet(tipoConfig);
    }
    return tipoConfig.__importablePaths.has(path);
};

const debugExportResolution = (key, ensayo, flattenedData, remappedKey, match, finalValue) => {
    const isDebugEnabled = false;
    if (!isDebugEnabled) return;

    const missing = finalValue === '' || finalValue === null || finalValue === undefined;
    if (!missing) return;

    const sampleKeys = Object.keys(flattenedData)
        .filter((k) => k.includes('tables.'))
        .slice(0, 40);

    console.log('[EXPORT TRACE] No se pudo resolver valor', {
        ensayoId: ensayo?.id,
        codigoEnsayo: ensayo?.codigo_ensayo,
        originalKey: key,
        remappedKey,
        matchFound: match || null,
        availableKeysSample: sampleKeys
    });
};

const resolveValue = (key, ensayo, flattenedData, isCantera = false) => {
    if (key.startsWith('metadata.')) {
        const metaKey = key.split('.')[1];
        switch (metaKey) {
            case 'codigo_ensayo':
                return ensayo.codigo_ensayo
                    || flattenedData['codigo_ensayo']
                    || flattenedData['general_fields.codigo_ensayo']
                    || flattenedData['metadata.codigo_ensayo']
                    || extractCodigoFromNombreEnsayo(ensayo.nombre_ensayo);
            case 'fecha':
                return formatDateForExport(
                    ensayo.fecha
                    || flattenedData['fecha']
                    || flattenedData['general_fields.fecha']
                    || flattenedData['metadata.fecha']
                    || ''
                );
            case 'progresiva': return formatProgresivaForExport(ensayo.progresiva_codigo);
            case 'cantera': return ensayo.cantera_nombre;
            case 'estrato': return ensayo.estrato_orden;
            case 'identificador':
                return resolveEnsayoIdentifier(ensayo, flattenedData);
            default: return '';
        }
    }
    if (flattenedData[key] !== undefined) return flattenedData[key];

    const remappedKey = remapExportKeyFromConfig(key, ensayo);
    if (remappedKey !== key && flattenedData[remappedKey] !== undefined) {
        return flattenedData[remappedKey];
    }

    const normTarget = normalizeKeyForExport(key);
    const remappedNormTarget = normalizeKeyForExport(remappedKey);
    const match = Object.keys(flattenedData).find(pk =>
        normalizeKeyForExport(pk) === normTarget ||
        normalizeKeyForExport(pk).endsWith(normTarget) ||
        normalizeKeyForExport(pk) === remappedNormTarget ||
        normalizeKeyForExport(pk).endsWith(remappedNormTarget)
    );
    const finalValue = match ? flattenedData[match] : '';
    debugExportResolution(key, ensayo, flattenedData, remappedKey, match, finalValue);
    return finalValue;
};

const setNestedValue = (target, path, value) => {
    if (!path) return;
    const parts = String(path).split('.').filter(Boolean);
    if (!parts.length) return;

    let current = target;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (typeof current[part] !== 'object' || current[part] === null || Array.isArray(current[part])) {
            current[part] = {};
        }
        current = current[part];
    }

    current[parts[parts.length - 1]] = value;
};

const parseExcelCellValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;

    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const normalized = trimmed.replace(/,/g, '');
    if (/^-?\d+(\.\d+)?$/.test(normalized)) {
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? trimmed : parsed;
    }

    return trimmed;
};

const parseExcelDateValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const direct = new Date(raw);
    if (!Number.isNaN(direct.getTime())) {
        return direct.toISOString().slice(0, 10);
    }

    const buildIsoDate = (year, month, day) => {
        const numericYear = Number(year);
        const numericMonth = Number(month);
        const numericDay = Number(day);

        if (!numericYear || numericMonth < 1 || numericMonth > 12 || numericDay < 1 || numericDay > 31) {
            return null;
        }

        const candidate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
        if (
            Number.isNaN(candidate.getTime()) ||
            candidate.getUTCFullYear() !== numericYear ||
            candidate.getUTCMonth() !== (numericMonth - 1) ||
            candidate.getUTCDate() !== numericDay
        ) {
            return null;
        }

        return `${numericYear}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`;
    };

    const dmySlash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmySlash) {
        const [, day, month, year] = dmySlash;
        return buildIsoDate(year, month, day);
    }

    const ymdSlash = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (ymdSlash) {
        const [, year, month, day] = ymdSlash;
        return buildIsoDate(year, month, day);
    }

    const dmy = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmy) {
        const [, day, month, year] = dmy;
        return buildIsoDate(year, month, day);
    }

    const ymdDash = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdDash) {
        const [, year, month, day] = ymdDash;
        return buildIsoDate(year, month, day);
    }

    return null;
};

const normalizeProgresivaForLookup = (value) => {
    if (!value) return '';
    const raw = String(value).trim().toLowerCase().replace(/\s+/g, '');
    if (!raw) return '';

    if (/^\d+-\d+-\d+$/.test(raw)) {
        const parts = raw.split('-');
        const meters = parseInt(parts[parts.length - 1], 10);
        if (!Number.isNaN(meters)) {
            const km = Math.floor(meters / 1000);
            const remainingMeters = meters % 1000;
            return `${km}+${String(remainingMeters).padStart(3, '0')}`;
        }
    }

    const compact = raw.replace(/[^0-9+]/g, '');
    if (/^\d+\+\d+$/.test(compact)) {
        const [km, meters] = compact.split('+');
        const totalMeters = (parseInt(km, 10) * 1000) + parseInt(meters, 10);
        const normalizedKm = Math.floor(totalMeters / 1000);
        const normalizedMeters = totalMeters % 1000;
        return `${normalizedKm}+${String(normalizedMeters).padStart(3, '0')}`;
    }

    const onlyDigits = raw.replace(/\D/g, '');
    if (onlyDigits) {
        const meters = parseInt(onlyDigits, 10);
        if (!Number.isNaN(meters)) {
            const km = Math.floor(meters / 1000);
            const remainingMeters = meters % 1000;
            return `${km}+${String(remainingMeters).padStart(3, '0')}`;
        }
    }

    return raw.replace(/-/g, '+');
};

const buildKeysMapFromExportConfig = (config, isCantera = false) => {
    const tablas = config?.tablas || [{ headers: config?.headers || [] }];
    const result = [];

    for (const tabla of tablas) {
        const allHeaders = [...getStandardMetadataHeaders(isCantera), ...(tabla?.headers || [])];
        const keysMap = [];

        allHeaders.forEach((header) => {
            if (header?.subheaders && header.subheaders.length > 0) {
                header.subheaders.forEach((subheader) => {
                    keysMap.push({ key: subheader.key, header: subheader.header });
                });
            } else if (header?.key) {
                keysMap.push({ key: header.key, header: header.header });
            }
        });

        result.push({
            tabla,
            keysMap
        });
    }

    return result;
};

const findHeaderRowIndex = (rows) => {
    const target = normalizeConfiguredKey('CÓDIGO ENSAYO');
    return rows.findIndex((row) =>
        Array.isArray(row) &&
        row.some((cell) => normalizeConfiguredKey(cell) === target)
    );
};

const getImportSheetConfig = (tipoConfig = {}, worksheetName = '', exportSheetName = '') => {
    const importSheets = tipoConfig?.config_importacion?.sheets;
    if (!importSheets || typeof importSheets !== 'object') return {};

    const candidates = [worksheetName, exportSheetName].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate && importSheets[candidate]) return importSheets[candidate];
    }

    const normalizedCandidates = candidates.map((candidate) =>
        normalizeConfiguredKey(candidate, tipoConfig?.config_normalizacion || {})
    );

    const matchedEntry = Object.entries(importSheets).find(([sheetKey]) => {
        const normalizedSheetKey = normalizeConfiguredKey(sheetKey, tipoConfig?.config_normalizacion || {});
        return normalizedCandidates.includes(normalizedSheetKey);
    });

    return matchedEntry?.[1] || {};
};

const extractDataBlocksFromSheet = (rows, config, importSheetConfig = {}) => {
    const mappedTables = buildKeysMapFromExportConfig(config, false);
    const blocks = [];
    let cursor = 0;

    for (const mappedTable of mappedTables) {
        const slicedRows = rows.slice(cursor);
        const localHeaderIndex = findHeaderRowIndex(slicedRows);
        if (localHeaderIndex === -1) break;

        const absoluteHeaderIndex = cursor + localHeaderIndex;
        const allHeaders = [...getStandardMetadataHeaders(false), ...(mappedTable.tabla?.headers || [])];
        const hasSubheaders = allHeaders.some((header) => header?.subheaders && header.subheaders.length > 0);
        const configuredHeaderRows = Number(importSheetConfig?.header_rows);
        const headerRows = Number.isFinite(configuredHeaderRows) && configuredHeaderRows > 0
            ? configuredHeaderRows
            : (hasSubheaders ? 2 : 1);
        const dataStartIndex = absoluteHeaderIndex + headerRows;

        const dataRows = [];
        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i] || [];
            const isEmpty = !row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '');
            if (isEmpty) {
                cursor = i + 1;
                break;
            }
            dataRows.push(row);
            cursor = i + 1;
        }

        blocks.push({
            tabla: mappedTable.tabla,
            keysMap: mappedTable.keysMap,
            dataRows
        });
    }

    return blocks;
};

const buildImportPayloadFromRow = (row, keysMap, tipoConfig) => {
    const ensayoDraft = {
        datos_formulario: {}
    };

    keysMap.forEach((headerConfig, index) => {
        const rawValue = row[index];
        const value = parseExcelCellValue(rawValue);
        if (value === null || value === undefined || value === '') return;

        const exportKey = headerConfig.key;
        if (!exportKey) return;

        if (exportKey.startsWith('metadata.')) {
            const metaKey = exportKey.split('.')[1];
            if (metaKey === 'codigo_ensayo') ensayoDraft.codigo_ensayo = String(value).trim();
            if (metaKey === 'fecha') ensayoDraft.fecha = parseExcelDateValue(rawValue);
            if (metaKey === 'progresiva') ensayoDraft.progresiva = String(value).trim();
            if (metaKey === 'estrato') ensayoDraft.estrato = String(value).trim();
            if (metaKey === 'identificador') ensayoDraft.identificador = String(value).trim();
            return;
        }

        const internalKey = remapExportKeyFromConfig(exportKey, tipoConfig);
        if (!isImportablePath(internalKey, tipoConfig)) return;
        setNestedValue(ensayoDraft.datos_formulario, internalKey, value);
    });

    return ensayoDraft;
};

const buildDraftMergeKey = (draft) => {
    const codigo = String(draft?.codigo_ensayo || '').trim();
    if (codigo) return `codigo::${draft.tipo_ensayo}::${codigo}`;

    const identificador = String(draft?.identificador || '').trim();
    const progresiva = normalizeProgresivaForLookup(draft?.progresiva);
    const estrato = String(draft?.estrato || '').trim();
    if (identificador && progresiva && estrato) {
        return `identificador::${draft.tipo_ensayo}::${progresiva}::${estrato}::${identificador}`;
    }
    if (identificador) return `identificador::${draft.tipo_ensayo}::${identificador}`;

    if (progresiva && estrato) return `ubicacion::${draft.tipo_ensayo}::${progresiva}::${estrato}`;

    return null;
};

const mergeDraftPayloads = (baseDraft, incomingDraft) => ({
    ...baseDraft,
    ...incomingDraft,
    fecha: baseDraft.fecha || incomingDraft.fecha || null,
    codigo_ensayo: baseDraft.codigo_ensayo || incomingDraft.codigo_ensayo || null,
    identificador: baseDraft.identificador || incomingDraft.identificador || null,
    progresiva: baseDraft.progresiva || incomingDraft.progresiva || null,
    estrato: baseDraft.estrato || incomingDraft.estrato || null,
    datos_formulario: deepMergeObjects(baseDraft.datos_formulario || {}, incomingDraft.datos_formulario || {})
});

const loadImportContext = async (tramoId, tipoEnsayoIds = []) => {
    const [progresivasResult, ensayosResult] = await Promise.all([
        db.query(`
        SELECT
                prog.id AS progresiva_id,
                prog.codigo AS progresiva_codigo,
                prog.nombre AS progresiva_nombre,
                est.id AS estrato_id,
                est.orden AS estrato_orden
            FROM progresivas prog
            JOIN estratos est ON est.parent_id = prog.id
            WHERE prog.parent_id = $1
        `, [tramoId]),
        db.query(`
            SELECT
                e.id,
                e.codigo_ensayo,
                e.identificador,
                e.tipo_ensayo,
                e.estrato_id
            FROM ensayos e
            JOIN estratos est ON e.estrato_id = est.id
            JOIN progresivas prog ON est.parent_id = prog.id
            WHERE prog.parent_id = $1
        `, [tramoId])
    ]);

    const progresivaMap = new Map();
    progresivasResult.rows.forEach((row) => {
        const keys = [
            normalizeProgresivaForLookup(row.progresiva_codigo),
            normalizeProgresivaForLookup(row.progresiva_nombre)
        ].filter(Boolean);

        keys.forEach((normalizedKey) => {
            progresivaMap.set(`${normalizedKey}::${String(row.estrato_orden).trim()}`, row);
        });
    });

    const ensayoMap = new Map();
    const ensayoIdentifierMap = new Map();
    ensayosResult.rows.forEach((row) => {
        if (row.codigo_ensayo) {
            ensayoMap.set(`${row.tipo_ensayo}::${String(row.codigo_ensayo).trim()}`, row);
        }
        if (row.identificador) {
            ensayoIdentifierMap.set(`${row.tipo_ensayo}::${row.estrato_id}::${String(row.identificador).trim()}`, row);
        }
    });

    return { progresivaMap, ensayoMap, ensayoIdentifierMap };
};

// --- MOTOR DE EXPORTACIÓN (SHEETJS / XLSX) ---

const _generateEnsayosExcelBuffer = async (ensayos, metadata = {}) => {
    console.log(`[EXPORT DEBUG] Usando motor XLSX (SheetJS) para ${ensayos.length} ensayos.`);
    const wb = XLSX.utils.book_new();
    const ensayosHydrated = [];

    for (const ensayo of ensayos) {
        ensayosHydrated.push(await ensureEnsayoDerivedFields(ensayo, db));
    }

    const grupos = {};
    ensayosHydrated.forEach(e => {
        if (!grupos[e.tipo_ensayo]) {
            grupos[e.tipo_ensayo] = { ensayos: [], config: e.config_export_excel, descripcion: e.tipo_ensayo_descripcion };
        }
        grupos[e.tipo_ensayo].ensayos.push(e);
    });

    for (const typeId in grupos) {
        const grupo = grupos[typeId];
        let configs = Array.isArray(grupo.config) ? grupo.config : [grupo.config];

        for (const config of configs) {
            if (!config || (!config.tablas && !config.headers)) continue;

            let sheetName = (config.sheetName || grupo.descripcion || 'Hoja')
                .replace(/[\\\/\?\*\[\]\:]/g, '-')
                .substring(0, 31);

            const tablas = config.tablas || [{ headers: config.headers, title: config.titulo }];
            const rows = [];
            const merges = [];

            for (const tabla of tablas) {
                if (!tabla.headers) continue;

                // Título
                if (tabla.title || config.mainTitle) {
                    const titleText = (tabla.title || config.mainTitle).replace('{tramo.nombre}', metadata.tramoNombre || '');
                    rows.push([titleText]);
                    rows.push([]); // Espacio
                }

                const isCantera = ensayos.some(e => e.cantera_nombre);
                const allHeaders = [...getStandardMetadataHeaders(isCantera), ...tabla.headers];
                const hasSubheaders = allHeaders.some(h => h.subheaders && h.subheaders.length > 0);

                const h1Row = [];
                const h2Row = [];
                const keysMap = [];

                let colIdx = 0;
                allHeaders.forEach(h => {
                    if (h.subheaders && h.subheaders.length > 0) {
                        h1Row.push(h.header);
                        for (let i = 1; i < h.subheaders.length; i++) h1Row.push(""); // Celdas vacías para el merge

                        // Merge horizontal en H1
                        merges.push({ s: { r: rows.length, c: colIdx }, e: { r: rows.length, c: colIdx + h.subheaders.length - 1 } });

                        h.subheaders.forEach(sh => {
                            h2Row.push(sh.header);
                            keysMap.push({ key: sh.key, width: sh.width || h.width });
                        });
                        colIdx += h.subheaders.length;
                    } else {
                        h1Row.push(h.header);
                        if (hasSubheaders) {
                            h2Row.push(""); // Celda vacía para merge vertical
                            merges.push({ s: { r: rows.length, c: colIdx }, e: { r: rows.length + 1, c: colIdx } });
                        }
                        keysMap.push({ key: h.key, width: h.width });
                        colIdx++;
                    }
                });

                rows.push(h1Row);
                if (hasSubheaders) rows.push(h2Row);

                // Datos
                grupo.ensayos.forEach(ensayo => {
                    const flattened = transformEnsayoDataMap(ensayo);
                    const rowData = keysMap.map(km => {
                        const val = resolveValue(km.key, ensayo, flattened, isCantera);
                        if (val === null || val === undefined) return '';
                        if (typeof val === 'object') return JSON.stringify(val);
                        // SheetJS maneja mejor los strings que empiezan con + si se fuerza tipo string
                        return val;
                    });
                    rows.push(rowData);
                });

                rows.push([]); // Espacio entre tablas
            }

            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!merges'] = merges;

            // Configurar anchos (SheetJS usa caracteres, aprox)
            ws['!cols'] = rows[0] ? rows[0].map((_, i) => ({ wch: 15 })) : [];

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    console.log(`[EXPORT DEBUG] Buffer XLSX generado: ${buffer.length} bytes.`);
    return buffer;
};

// --- RESTO DE FUNCIONES (IGUALES) ---

const exportEnsayosToExcelByTramo = async (tramoId) => {
    const tramo = (await db.query('SELECT nombre FROM progresivas WHERE id = $1', [tramoId])).rows[0];
    if (!tramo) throw new Error('Tramo no encontrado.');
    const result = await db.query(`
        SELECT e.*, te.descripcion AS tipo_ensayo_descripcion, te.config_export_excel, te.config_importacion, te.config_normalizacion, te.config_tabla, te.config_key,
               prog.codigo AS progresiva_codigo, est.orden AS estrato_orden
        FROM ensayos e
        JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
        JOIN estratos est ON e.estrato_id = est.id 
        JOIN progresivas prog ON est.parent_id = prog.id 
        WHERE prog.parent_id = $1
    `, [tramoId]);
    return await _generateEnsayosExcelBuffer(result.rows, { tramoNombre: tramo.nombre });
};

const exportEnsayosToExcelByTipo = async (tramoId, tipoEnsayoId) => {
    const tramo = (await db.query('SELECT nombre FROM progresivas WHERE id = $1', [tramoId])).rows[0];
    const result = await db.query(`
        SELECT e.*, te.descripcion AS tipo_ensayo_descripcion, te.config_export_excel, te.config_importacion, te.config_normalizacion, te.config_tabla, te.config_key,
               prog.codigo AS progresiva_codigo, est.orden AS estrato_orden
        FROM ensayos e
        JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
        JOIN estratos est ON e.estrato_id = est.id
        JOIN progresivas prog ON est.parent_id = prog.id
        WHERE prog.parent_id = $1 AND e.tipo_ensayo = $2
    `, [tramoId, tipoEnsayoId]);

    if (result.rows.length === 0) {
        const te = (await db.query('SELECT descripcion, config_export_excel, config_importacion, config_normalizacion, config_tabla FROM tipo_ensayo WHERE id = $1', [tipoEnsayoId])).rows[0];
        if (te) return await _generateEnsayosExcelBuffer([{ tipo_ensayo: tipoEnsayoId, tipo_ensayo_descripcion: te.descripcion, config_export_excel: te.config_export_excel, config_importacion: te.config_importacion, config_normalizacion: te.config_normalizacion, config_tabla: te.config_tabla }], { tramoNombre: tramo?.nombre });
    }
    return await _generateEnsayosExcelBuffer(result.rows, { tramoNombre: tramo?.nombre });
};

const exportCanteraEnsayosToExcelByTipo = async (tipoEnsayoId) => {
    const result = await db.query(`
        SELECT e.*, te.descripcion AS tipo_ensayo_descripcion, te.config_export_excel, te.config_importacion, te.config_normalizacion, te.config_tabla, te.config_key,
               can.nombre AS cantera_nombre, est.orden AS estrato_orden
        FROM ensayos e
        JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
        JOIN estratos est ON e.estrato_id = est.id
        JOIN canteras can ON est.parent_id = can.id
        WHERE e.tipo_ensayo = $1
    `, [tipoEnsayoId]);
    return await _generateEnsayosExcelBuffer(result.rows);
};

const importarEnsayos = async (proyectoId, tramoId, excelBuffer, user, isSimulation = false, options = {}) => {
    const workbook = XLSX.read(excelBuffer, { type: 'buffer', cellDates: true });
    const requestedConfigKey = options?.configKey || null;

    const tiposResult = await db.query(`
        SELECT
            id,
            descripcion,
            config_key,
            config_tabla,
            config_export_excel,
            config_importacion,
            config_normalizacion
        FROM tipo_ensayo
        ORDER BY id
    `);

    const tipos = tiposResult.rows.filter((tipo) => {
        if (!requestedConfigKey) return true;
        return tipo.config_key === requestedConfigKey || String(tipo.id) === String(requestedConfigKey);
    });

    const validationErrors = [];
    const drafts = [];
    const mergedDrafts = new Map();

    tipos.forEach((tipo) => {
        const exportConfigs = Array.isArray(tipo.config_export_excel)
            ? tipo.config_export_excel
            : [tipo.config_export_excel];

        exportConfigs.forEach((config) => {
            if (!config?.sheetName) return;

            const worksheetName = workbook.SheetNames.find((sheetName) =>
                normalizeConfiguredKey(sheetName, tipo.config_normalizacion) ===
                normalizeConfiguredKey(config.sheetName, tipo.config_normalizacion)
            );

            if (!worksheetName) return;

            const worksheet = workbook.Sheets[worksheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
            const importSheetConfig = getImportSheetConfig(tipo, worksheetName, config.sheetName);
            const blocks = extractDataBlocksFromSheet(rows, config, importSheetConfig);

            blocks.forEach((block) => {
                block.dataRows.forEach((row) => {
                    const draft = buildImportPayloadFromRow(row, block.keysMap, tipo);
                    const hasCode = draft.codigo_ensayo && String(draft.codigo_ensayo).trim() !== '';
                    const hasData = Object.keys(draft.datos_formulario || {}).length > 0 ||
                        !!draft.progresiva ||
                        !!draft.estrato ||
                        !!draft.fecha;

                    if (!hasCode && !hasData) return;
                    if (!hasCode) {
                        console.log('[IMPORT DEBUG] Fila sin CÓDIGO ENSAYO: se importará como ensayo nuevo', {
                            sheet: worksheetName,
                            row
                        });
                    }

                    const draftWithMeta = {
                        ...draft,
                        tipo_ensayo: tipo.id,
                        tipo_config: tipo,
                        sheetName: worksheetName
                    };

                    const mergeKey = buildDraftMergeKey(draftWithMeta);
                    if (!mergeKey) {
                        drafts.push(draftWithMeta);
                        return;
                    }

                    const existingDraft = mergedDrafts.get(mergeKey);
                    if (existingDraft) {
                        mergedDrafts.set(mergeKey, mergeDraftPayloads(existingDraft, draftWithMeta));
                    } else {
                        mergedDrafts.set(mergeKey, draftWithMeta);
                    }
                });
            });
        });
    });

    drafts.push(...mergedDrafts.values());

    const { progresivaMap, ensayoMap, ensayoIdentifierMap } = await loadImportContext(tramoId);
    const ensayosParaCrear = [];
    const ensayosParaActualizar = [];

    for (const draft of drafts) {
        const progresivaKey = normalizeProgresivaForLookup(draft.progresiva);
        const estratoOrden = String(draft.estrato || '').trim();
        const ubicacion = progresivaMap.get(`${progresivaKey}::${estratoOrden}`);

        const normalizedCodigo = draft.codigo_ensayo ? String(draft.codigo_ensayo).trim() : null;
        const normalizedIdentificador = draft.identificador ? String(draft.identificador).trim() : null;
        const existingByCodigo = normalizedCodigo
            ? ensayoMap.get(`${draft.tipo_ensayo}::${normalizedCodigo}`)
            : null;
        const targetEstratoId = ubicacion?.estrato_id || existingByCodigo?.estrato_id || null;
        const existingByIdentificador = !existingByCodigo && normalizedIdentificador && targetEstratoId
            ? ensayoIdentifierMap.get(`${draft.tipo_ensayo}::${targetEstratoId}::${normalizedIdentificador}`)
            : null;
        const existing = existingByCodigo || existingByIdentificador || null;

        if (!targetEstratoId) {
            validationErrors.push({
                sheet: draft.sheetName,
                error: `No se encontró la progresiva/estrato para el ensayo ${draft.codigo_ensayo} (${draft.progresiva || 'sin progresiva'} / estrato ${draft.estrato || 'sin estrato'}).`
            });
            continue;
        }

        const tableConfig = await getTipoEnsayoTableConfig(draft.tipo_ensayo);
        const hasMeaningfulData = hasMeaningfulFormData(draft.datos_formulario, tableConfig);

        const payload = {
            estrato_id: targetEstratoId,
            tipo_ensayo: draft.tipo_ensayo,
            nombre_ensayo: normalizedCodigo ? `Importado (${normalizedCodigo})` : `Nuevo ensayo importado`,
            fecha: draft.fecha || null,
            datos_formulario: draft.datos_formulario,
            codigo_ensayo: normalizedCodigo,
            identificador: normalizedIdentificador || null,
            estado: hasMeaningfulData ? 'completado' : 'pendiente'
        };

        if (existing) {
            ensayosParaActualizar.push({ id: existing.id, payload, codigo_ensayo: normalizedCodigo });
        } else {
            ensayosParaCrear.push({ payload, codigo_ensayo: normalizedCodigo });
        }
    }

    const summary = {
        ensayosParaCrear: ensayosParaCrear.length,
        ensayosParaActualizar: ensayosParaActualizar.length
    };

    if (isSimulation) {
        return {
            summary,
            created: 0,
            updated: 0,
            errors: validationErrors,
            log: [`Simulación completada: ${summary.ensayosParaCrear} por crear, ${summary.ensayosParaActualizar} por actualizar.`]
        };
    }

    let created = 0;
    let updated = 0;

    for (const item of ensayosParaCrear) {
        await createOrUpdateFullAssay(null, item.payload);
        created += 1;
    }

    for (const item of ensayosParaActualizar) {
        await createOrUpdateFullAssay(item.id, item.payload);
        updated += 1;
    }

    return {
        summary,
        created,
        updated,
        errors: validationErrors,
        log: [`Importación completada: ${created} creados, ${updated} actualizados.`]
    };
};

const getAllTiposEnsayo = async () => {
    const result = await db.query('SELECT * FROM tipo_ensayo ORDER BY descripcion');
    return result.rows;
};

const getTipoEnsayos = async () => {
    const result = await db.query('SELECT * FROM tipo_ensayo ORDER BY descripcion');
    return result.rows;
};

const getAllCanteraEnsayos = async () => {
    const result = await db.query(`
        SELECT e.*, te.descripcion as tipo_ensayo_descripcion, te.config_key, te.results_config, te.config_calculos,
               can.nombre as cantera_nombre, est.orden as estrato_orden
        FROM ensayos e
        JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
        JOIN estratos est ON e.estrato_id = est.id
        JOIN canteras can ON est.parent_id = can.id
        ORDER BY e.fecha DESC
    `);
    const rows = [];
    for (const row of result.rows) {
        rows.push(await ensureEnsayoDerivedFields(row, db));
    }
    return rows;
};

const getEnsayosByTramoId = async (tramoId) => {
    console.log(`[DEBUG] ensayosService.getEnsayosByTramoId called for tramoId: ${tramoId}`);
    try {
        const result = await db.query(`
            SELECT 
                ens.*,
                te.descripcion as tipo_ensayo_descripcion,
                te.config_key,
                te.results_config,
                te.config_calculos,
                prog.nombre as progresiva_nombre,
                est.orden as estrato_orden,
                est.parent_id as progresiva_id
            FROM ensayos ens
            LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
            LEFT JOIN estratos est ON ens.estrato_id = est.id
            LEFT JOIN progresivas prog ON est.parent_id = prog.id
            WHERE prog.parent_id = $1 OR prog.id = $1
            ORDER BY ens.fecha DESC
        `, [tramoId]);
        console.log(`[DEBUG] getEnsayosByTramoId: Found ${result.rows.length} assays`);
        const rows = [];
        for (const row of result.rows) {
            rows.push(await ensureEnsayoDerivedFields(row, db));
        }
        return rows;
    } catch (error) {
        console.error(`[ERROR] getEnsayosByTramoId for tramo ${tramoId}:`, error);
        throw error;
    }
};

const getFormularioConfig = async (tipoEnsayoId) => {
    console.log(`[DEBUG] getFormularioConfig called for ID: ${tipoEnsayoId}`);
    try {
        const result = await db.query(`
            SELECT
                id,
                descripcion,
                config_key,
                results_config,
                config_tabla,
                config_calculos,
                config_graficos,
                config_export_excel,
                config_importacion,
                config_reporte_pdf
            FROM tipo_ensayo
            WHERE id = $1
        `, [tipoEnsayoId]);

        const row = result.rows[0];
        if (!row) return null;

        return {
            ...row,
            // Aliases para compatibilidad con el frontend actual.
            formConfig: row.config_tabla,
            tableConfig: row.config_tabla,
            resultsConfig: row.results_config,
            calculationConfig: row.config_calculos,
            graficosConfig: row.config_graficos,
            exportConfig: row.config_export_excel,
            importConfig: row.config_importacion,
            reportConfig: row.config_reporte_pdf
        };
    } catch (error) {
        console.error(`[ERROR] getFormularioConfig for ${tipoEnsayoId}:`, error);
        throw error;
    }
};

const createBaseEnsayo = async (data, client = null) => {
    const { estrato_id, tipo_ensayo_id, nombre_ensayo, estado } = data;
    console.log(`[DEBUG] createBaseEnsayo for estrato ${estrato_id}, tipo ${tipo_ensayo_id}`);
    const pool = client || db;
    try {
        const derived = await buildDerivedEnsayoFields({
            estratoId: estrato_id,
            tipoEnsayoId: tipo_ensayo_id
        }, pool);
        const identificador =
            normalizeIdentificadorInput(data.identificador)
            || await getNextIdentificadorByContext(estrato_id, tipo_ensayo_id, null, pool);

        const result = await pool.query(`
            INSERT INTO ensayos (
                estrato_id, tipo_ensayo, nombre_ensayo, fecha, estado, identificador,
                proyecto_id, progresiva, codigo_tramo, tipo_via,
                tipo_ensayo_codigo, correlativo_tipo_ensayo,
                codigo_generado, codigo_ensayo
            )
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            estrato_id,
            tipo_ensayo_id,
            nombre_ensayo || 'Nuevo Ensayo',
            estado || 'pendiente',
            identificador,
            derived?.proyecto_id || null,
            derived?.progresiva || null,
            derived?.codigo_tramo || null,
            derived?.tipo_via || null,
            derived?.tipo_ensayo_codigo || null,
            derived?.correlativo_tipo_ensayo || null,
            derived?.codigo_generado || null,
            derived?.codigo_ensayo || null
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('[ERROR] createBaseEnsayo:', error);
        throw error;
    }
};

const updateBaseEnsayo = async (id, data) => {
    const { nombre_ensayo, estado } = data;
    console.log(`[DEBUG] updateBaseEnsayo ID ${id}: name=${nombre_ensayo}, state=${estado}`);
    try {
        const result = await db.query(`
            UPDATE ensayos 
            SET nombre_ensayo = $1, estado = $2
            WHERE id = $3
            RETURNING *
        `, [nombre_ensayo, estado, id]);
        return result.rows[0];
    } catch (error) {
        console.error(`[ERROR] updateBaseEnsayo ${id}:`, error);
        throw error;
    }
};

const getEnsayos = async () => {
    try {
        const result = await db.query('SELECT * FROM ensayos ORDER BY fecha DESC');
        const rows = [];
        for (const row of result.rows) {
            rows.push(await ensureEnsayoDerivedFields(row, db));
        }
        return rows;
    } catch (error) {
        console.error('[ERROR] getEnsayos:', error);
        throw error;
    }
};

const deleteEnsayo = async (id) => {
    console.log(`[DEBUG] deleteEnsayo called for ID: ${id}`);
    try {
        const result = await db.query('DELETE FROM ensayos WHERE id = $1', [id]);
        return result.rowCount;
    } catch (error) {
        console.error(`[ERROR] deleteEnsayo ${id}:`, error);
        throw error;
    }
};

const bulkDeleteEnsayos = async (ids) => {
    console.log(`[DEBUG] bulkDeleteEnsayos for IDs: ${ids}`);
    try {
        const result = await db.query('DELETE FROM ensayos WHERE id = ANY($1)', [ids]);
        return result.rowCount;
    } catch (error) {
        console.error('[ERROR] bulkDeleteEnsayos:', error);
        throw error;
    }
};

const getEnsayoDetailsById = async (id) => {
    console.log(`[DEBUG] getEnsayoDetailsById called for ID: ${id}`);
    try {
        const result = await db.query(`
            SELECT 
                ens.*,
                te.descripcion as tipo_ensayo_descripcion,
                te.config_key,
                te.results_config,
                te.config_tabla,
                te.config_calculos,
                te.config_graficos,
                te.config_reporte_pdf,
                est.parent_type,
                est.parent_id,
                est.orden as estrato_orden,
                prog.id as progresiva_id,
                prog.codigo as progresiva_codigo,
                prog.nombre as progresiva_nombre,
                tramo.id as tramo_id,
                tramo.nombre as tramo_nombre,
                can.id as cantera_id,
                can.nombre as cantera_nombre,
                can.id_progresiva_referencia as progresiva_referencia_id,
                pref.codigo as cantera_codigo,
                proy_prog.id as proyecto_id_progresiva,
                COALESCE(
                    to_jsonb(proy_prog)->>'nombre',
                    to_jsonb(proy_prog)->>'nombre_proyecto',
                    to_jsonb(proy_prog)->>'proyecto_nom'
                ) as proyecto_nombre_progresiva,
                proy_can.id as proyecto_id_cantera,
                COALESCE(
                    to_jsonb(proy_can)->>'nombre',
                    to_jsonb(proy_can)->>'nombre_proyecto',
                    to_jsonb(proy_can)->>'proyecto_nom'
                ) as proyecto_nombre_cantera
            FROM ensayos ens
            LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
            LEFT JOIN estratos est ON ens.estrato_id = est.id
            LEFT JOIN progresivas prog ON est.parent_type = 'progresiva' AND est.parent_id = prog.id
            LEFT JOIN progresivas tramo ON prog.parent_id = tramo.id
            LEFT JOIN proyectos proy_prog ON prog.proyecto_id = proy_prog.id
            LEFT JOIN canteras can ON est.parent_type = 'cantera' AND est.parent_id = can.id
            LEFT JOIN progresivas pref ON can.id_progresiva_referencia = pref.id
            LEFT JOIN proyectos proy_can ON can.id_proyecto = proy_can.id
            WHERE ens.id = $1
        `, [id]);
        const row = result.rows[0];
        if (!row) return null;
        const hydratedRow = await ensureEnsayoDerivedFields(row, db);

        return {
            ...hydratedRow,
            // Compatibilidad con el frontend actual.
            datos_ensayo: hydratedRow.datos_formulario,
            tipo_ensayo_id: hydratedRow.tipo_ensayo,
            proyecto_id: hydratedRow.proyecto_id_progresiva || hydratedRow.proyecto_id_cantera || hydratedRow.proyecto_id || null,
            proyecto_nombre: hydratedRow.proyecto_nombre_progresiva || hydratedRow.proyecto_nombre_cantera || null,
            tramo_id: hydratedRow.tramo_id || hydratedRow.progresiva_referencia_id || null,
            tramo_nombre: hydratedRow.tramo_nombre || null,
            config_reporte_pdf: hydratedRow.config_reporte_pdf
        };
    } catch (error) {
        console.error(`[ERROR] getEnsayoDetailsById ${id}:`, error);
        throw error;
    }
};

const createOrUpdateFullAssay = async (id, data) => {
    console.log(`[DEBUG] createOrUpdateFullAssay ID=${id}`);

    let autoEstado = data.estado;
    const datos = data.datos_formulario ?? data.datos_ensayo;
    const effectiveTipoEnsayoForStatus = data.tipo_ensayo ?? data.tipo_ensayo_id;
    const tableConfig = await getTipoEnsayoTableConfig(effectiveTipoEnsayoForStatus);
    const hasDataForm = hasMeaningfulFormData(datos, tableConfig);
    const normalizedEstado = String(autoEstado || '').toLowerCase();

    if (!autoEstado || normalizedEstado === 'pendiente' || normalizedEstado === 'completado') {
        autoEstado = hasDataForm ? 'completado' : 'pendiente';
    }

    const normalizedData = {
        estrato_id: data.estrato_id,
        tipo_ensayo: data.tipo_ensayo ?? data.tipo_ensayo_id,
        nombre_ensayo: data.nombre_ensayo,
        fecha: data.fecha,
        resultado: data.resultado,
        estado: autoEstado,
        datos_formulario: datos,
        codigo_ensayo: data.codigo_ensayo,
        identificador: normalizeIdentificadorInput(data.identificador)
    };

    try {
        const currentResult = id
            ? await db.query('SELECT * FROM ensayos WHERE id = $1', [id])
            : { rows: [] };
        const current = currentResult.rows[0] || null;

        const effectiveEstratoId = normalizedData.estrato_id ?? current?.estrato_id;
        const effectiveTipoEnsayo = normalizedData.tipo_ensayo ?? current?.tipo_ensayo;
        const effectiveCodigoEnsayo = normalizedData.codigo_ensayo ?? current?.codigo_ensayo ?? null;
        const effectiveCorrelativo = current?.correlativo_tipo_ensayo ?? null;
        const currentIdentificador = normalizeIdentificadorInput(current?.identificador);
        const shouldGenerateIdentificador = effectiveEstratoId && effectiveTipoEnsayo && !normalizedData.identificador && !currentIdentificador;
        const effectiveIdentificador = normalizedData.identificador
            ?? currentIdentificador
            ?? (
                shouldGenerateIdentificador
                    ? await getNextIdentificadorByContext(effectiveEstratoId, effectiveTipoEnsayo, id || null, db)
                    : null
            );

        const derived = await buildDerivedEnsayoFields({
            ensayoId: id,
            estratoId: effectiveEstratoId,
            tipoEnsayoId: effectiveTipoEnsayo,
            existingCodigoEnsayo: effectiveCodigoEnsayo,
            existingCorrelativo: effectiveCorrelativo
        });

        if (id) {
            if (!current) return null;

            const result = await db.query(`
                UPDATE ensayos SET
                    estrato_id = $1, tipo_ensayo = $2, nombre_ensayo = $3, 
                    fecha = $4, resultado = $5, estado = $6, 
                    datos_formulario = $7, codigo_ensayo = $8,
                    identificador = $9, proyecto_id = $10,
                    progresiva = $11, codigo_tramo = $12,
                    tipo_via = $13, tipo_ensayo_codigo = $14,
                    correlativo_tipo_ensayo = $15,
                    codigo_generado = $16
                WHERE id = $17
                RETURNING *
            `, [
                normalizedData.estrato_id ?? current.estrato_id,
                normalizedData.tipo_ensayo ?? current.tipo_ensayo,
                normalizedData.nombre_ensayo ?? current.nombre_ensayo,
                normalizedData.fecha ?? current.fecha,
                normalizedData.resultado ?? current.resultado,
                normalizedData.estado ?? current.estado,
                normalizedData.datos_formulario ?? current.datos_formulario,
                derived?.codigo_ensayo ?? normalizedData.codigo_ensayo ?? current.codigo_ensayo,
                effectiveIdentificador ?? current.identificador,
                derived?.proyecto_id ?? current.proyecto_id,
                derived?.progresiva ?? current.progresiva,
                derived?.codigo_tramo ?? current.codigo_tramo,
                derived?.tipo_via ?? current.tipo_via,
                derived?.tipo_ensayo_codigo ?? current.tipo_ensayo_codigo,
                derived?.correlativo_tipo_ensayo ?? current.correlativo_tipo_ensayo,
                derived?.codigo_generado ?? current.codigo_generado,
                id
            ]);
            return result.rows[0];
        } else {
            const result = await db.query(`
                INSERT INTO ensayos (
                    estrato_id, tipo_ensayo, nombre_ensayo, fecha, 
                    resultado, estado, datos_formulario, codigo_ensayo,
                    identificador, proyecto_id, progresiva,
                    codigo_tramo, tipo_via, tipo_ensayo_codigo,
                    correlativo_tipo_ensayo, codigo_generado
                ) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `, [
                normalizedData.estrato_id,
                normalizedData.tipo_ensayo,
                normalizedData.nombre_ensayo,
                normalizedData.fecha ?? null,
                normalizedData.resultado ?? null,
                normalizedData.estado ?? 'pendiente',
                normalizedData.datos_formulario ?? {},
                derived?.codigo_ensayo ?? normalizedData.codigo_ensayo ?? null,
                effectiveIdentificador ?? null,
                derived?.proyecto_id ?? null,
                derived?.progresiva ?? null,
                derived?.codigo_tramo ?? null,
                derived?.tipo_via ?? null,
                derived?.tipo_ensayo_codigo ?? null,
                derived?.correlativo_tipo_ensayo ?? null,
                derived?.codigo_generado ?? null
            ]);
            return result.rows[0];
        }
    } catch (error) {
        console.error('[ERROR] createOrUpdateFullAssay:', error);
        throw error;
    }
};

const getEnsayosDetails = async () => {
    console.log('[DEBUG] getEnsayosDetails called');
    try {
        const result = await db.query(`
            SELECT 
                ens.*,
                te.descripcion as tipo_ensayo_descripcion,
                te.config_key,
                prog.nombre as progresiva_nombre,
                est.orden as estrato_orden
            FROM ensayos ens
            LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
            LEFT JOIN estratos est ON ens.estrato_id = est.id
            LEFT JOIN progresivas prog ON est.parent_id = prog.id
            ORDER BY ens.fecha DESC
        `);
        const rows = [];
        for (const row of result.rows) {
            rows.push(await ensureEnsayoDerivedFields(row, db));
        }
        return rows;
    } catch (error) {
        console.error('[ERROR] getEnsayosDetails:', error);
        throw error;
    }
};

module.exports = {
    exportEnsayosToExcelByTramo,
    exportEnsayosToExcelByTipo,
    exportCanteraEnsayosToExcelByTipo,
    importarEnsayos,
    getAllTiposEnsayo,
    getTipoEnsayos,
    getAllCanteraEnsayos,
    getEnsayosByTramoId,
    getFormularioConfig,
    createBaseEnsayo,
    updateBaseEnsayo,
    getEnsayos,
    getEnsayosDetails,
    deleteEnsayo,
    bulkDeleteEnsayos,
    getEnsayoDetailsById,
    createOrUpdateFullAssay
};
