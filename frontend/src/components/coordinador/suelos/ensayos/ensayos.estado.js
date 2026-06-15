const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizePath = (path, scope = "general_fields") => {
  if (!path) return "";
  return String(path).includes(".") ? String(path) : `${scope}.${path}`;
};

const collectExcludedPaths = (tableConfig) => {
  const excluded = new Set();

  const collect = (fields = [], scope = "general_fields") => {
    fields.forEach((field) => {
      const shouldExclude =
        field?.exclude_from_completion === true ||
        field?.input_config?.exclude_from_completion === true;

      if (!shouldExclude) return;
      excluded.add(normalizePath(field.path || field.key, scope));
    });
  };

  if (Array.isArray(tableConfig?.general_fields)) {
    collect(tableConfig.general_fields, "general_fields");
  }

  if (Array.isArray(tableConfig?.fields)) {
    collect(tableConfig.fields, "fields");
  }

  return excluded;
};

const hasMeaningfulLeaf = (value, excludedPaths, currentPath = "") => {
  if (!hasValue(value)) return false;
  if (excludedPaths.has(currentPath)) return false;

  if (Array.isArray(value)) {
    return value.some((item, index) =>
      hasMeaningfulLeaf(item, excludedPaths, `${currentPath}.${index}`),
    );
  }

  if (isPlainObject(value)) {
    return Object.entries(value).some(([key, child]) => {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      return hasMeaningfulLeaf(child, excludedPaths, childPath);
    });
  }

  return true;
};

export const hasMeaningfulAssayData = (formData, tableConfig) => {
  if (!isPlainObject(formData) && !Array.isArray(formData)) return false;
  const excludedPaths = collectExcludedPaths(tableConfig);
  return hasMeaningfulLeaf(formData, excludedPaths, "");
};

export const getEnsayoCompletionStatus = (ensayo, tableConfig) => {
  if (ensayo?.estado) {
    const estadoNormalizado = String(ensayo.estado).trim().toUpperCase();
    if (estadoNormalizado) return estadoNormalizado;
  }

  return hasMeaningfulAssayData(ensayo?.datos_formulario, tableConfig)
    ? "COMPLETADO"
    : "PENDIENTE";
};
