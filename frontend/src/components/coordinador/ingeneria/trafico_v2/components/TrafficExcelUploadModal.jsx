import { useCallback, useState } from 'react';
import axiosInstance from '@/api/axios';
import * as XLSX from 'xlsx';

const TrafficExcelUploadModal = ({ isOpen, onClose, entityId, selectedEntity, moduleConfig, setExtractedTrafficData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [groupDescription, setGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedFileTypes = '.xlsx, .xls';

  const handleFileSelection = useCallback((incomingFiles) => {
    if (incomingFiles && incomingFiles.length > 0) {
      // Tomamos solo el primer archivo, ya que es un Excel único
      setSelectedFile(incomingFiles[0]);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  }, [handleFileSelection]);

  const processExcelData = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          let extractedDataToSave = {};
          const stationNumber = entityId && entityId.includes('-') ? parseInt(entityId.split('-')[1], 10) : 1;

          // --- 1. CONTEO VEHICULAR ---
          try {
            const findStationSheet = (wb, num) => {
              const regex = new RegExp(`^FW_E0?${num}$`, 'i');
              return wb.SheetNames.find(n => regex.test(n.trim()));
            };
            const sheetName = findStationSheet(workbook, stationNumber) || `FW_E${stationNumber}`;
            const worksheet = workbook.Sheets[sheetName];

            if (worksheet) {
              const findRowIndex = (colIndex, searchText, startRow = 0, maxRow = 100) => {
                for (let r = startRow; r < maxRow; r++) {
                  const cellAddress = XLSX.utils.encode_cell({ r, c: colIndex });
                  const cell = worksheet[cellAddress];
                  if (cell && cell.v && cell.v.toString().trim().toUpperCase() === searchText) {
                    return r;
                  }
                }
                return -1;
              };

              let hourlyStartRow = -1;
              for (let r = 2; r <= 5; r++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
                const cell = worksheet[cellAddress];
                if (cell && cell.v && /^\\d{2}-\\d{2}$/.test(cell.v.toString().trim())) {
                  hourlyStartRow = r;
                  break;
                }
              }
              const hourlyStartRow1Based = hourlyStartRow !== -1 ? hourlyStartRow + 1 : 4;
              const totalRowIndex = findRowIndex(0, 'TOTAL', 20, 35);
              const hourlyEndRow1Based = totalRowIndex !== -1 ? totalRowIndex : 27;

              const rawHourlyLabels = XLSX.utils.sheet_to_json(worksheet, { range: `A${hourlyStartRow1Based}:A${hourlyEndRow1Based}`, header: 1 });
              const hourlyLabels = rawHourlyLabels.map(row => row[0]);
              const rawHourlyData = XLSX.utils.sheet_to_json(worksheet, { range: `U${hourlyStartRow1Based}:U${hourlyEndRow1Based}`, header: 1 });
              const hourlyData = rawHourlyData.map(row => Number(row[0]));

              let autosRowIndex = findRowIndex(1, 'AUTOS', 25, 45);
              if (autosRowIndex === -1) autosRowIndex = findRowIndex(1, 'Autos', 25, 45);
              
              const classStartRow = autosRowIndex !== -1 ? autosRowIndex : 32;
              const classEndRow = classStartRow + 12;
              const classStart1Based = classStartRow + 1;
              const classEnd1Based = classEndRow;

              const rawClassificationLabels = XLSX.utils.sheet_to_json(worksheet, { range: `B${classStart1Based}:B${classEnd1Based}`, header: 1 });
              const classificationLabels = rawClassificationLabels.map(row => row[0]);
              const rawClassificationData = XLSX.utils.sheet_to_json(worksheet, { range: `M${classStart1Based}:M${classEnd1Based}`, header: 1 });
              const classificationData = rawClassificationData.map(row => {
                const val = Number(row[0]);
                return isNaN(val) ? 0 : Number(val.toFixed(2));
              });

              const rawDailyHeaders = XLSX.utils.sheet_to_json(worksheet, { range: 'C32:I32', header: 1 });
              const dailyLabels = rawDailyHeaders.length > 0 ? rawDailyHeaders[0] : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const rawDailyBlock = XLSX.utils.sheet_to_json(worksheet, { range: 'C33:I44', header: 1 });
              const dailyData = [];
              if (rawDailyBlock.length > 0) {
                for (let i = 0; i < 7; i++) {
                  let daySum = 0;
                  rawDailyBlock.forEach(row => {
                    const val = Number(row[i]);
                    if (!isNaN(val)) daySum += val;
                  });
                  dailyData.push(daySum);
                }
              }

              Object.assign(extractedDataToSave, {
                hourlyLabels, hourlyData, classificationLabels, classificationData, dailyLabels, dailyData
              });
            }
          } catch(err) { console.warn("Error al extraer Conteo Vehicular", err); }

          // --- 2. ENCUESTA ORIGEN DESTINO ---
          try {
            const vpesSheetName = workbook.SheetNames.find(n => new RegExp(`OD\\.?\\s*VPES\\.?\\s*E0?${stationNumber}`, 'i').test(n));
            const vlivSheetName = workbook.SheetNames.find(n => new RegExp(`OD\\.?\\s*VLIV\\.?\\s*E0?${stationNumber}`, 'i').test(n));

            const extractODMatrix = (sheetName) => {
              if (!sheetName) return { data: [], origins: [] };
              const ws = workbook.Sheets[sheetName];
              const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
              
              console.log(`[OD Parser] Procesando hoja: ${sheetName}, filas: ${data.length}`);
              
              // Paso 1: Encontrar la fila de encabezados de destino
              // Es la fila que tiene múltiples strings (nombres de lugar) a partir de columna C
              let destRowIdx = -1;
              for (let r = 0; r < Math.min(data.length, 10); r++) {
                const row = data[r];
                if (!row) continue;
                let stringCount = 0;
                for (let c = 2; c < row.length; c++) {
                  const cell = row[c];
                  if (typeof cell === 'string' && cell.trim().length > 1 && 
                      !cell.trim().toUpperCase().includes('TOTAL') &&
                      !cell.trim().toUpperCase().includes('PARTICIPACI') &&
                      !cell.trim().toUpperCase().includes('%')) {
                    stringCount++;
                  }
                }
                if (stringCount >= 2) {
                  destRowIdx = r;
                  break;
                }
              }
              
              if (destRowIdx === -1) {
                console.warn(`[OD Parser] No se encontró fila de encabezados en ${sheetName}`);
                return { data: [], origins: [] };
              }
              
              console.log(`[OD Parser] Fila de destinos encontrada en índice: ${destRowIdx}`);
              
              // Paso 2: Extraer nombres de destinos válidos
              const destinoHeaders = [];
              const headerRow = data[destRowIdx];
              for (let c = 2; c < headerRow.length; c++) {
                const val = headerRow[c];
                // Saltar celdas vacías
                if (val === undefined || val === null || val === '') continue;
                // Extraer el nombre de destino
                const str = String(val).trim();
                const strUpper = str.toUpperCase();
                // Parar en TOTAL, %, PARTICIPACION
                if (strUpper === 'TOTAL' || strUpper === 'TOTALES' || 
                    strUpper.includes('%') || strUpper.includes('PARTICIPACI')) {
                  break;
                }
                if (str.length > 0) {
                  destinoHeaders.push({ col: c, name: str });
                }
              }
              
              if (destinoHeaders.length === 0) {
                console.warn(`[OD Parser] No se encontraron destinos válidos en ${sheetName}`);
                return { data: [], origins: [] };
              }
              
              console.log(`[OD Parser] Destinos encontrados: ${destinoHeaders.map(d => d.name).join(', ')}`);
              
              // Paso 3: Leer filas de orígenes y valores de la matriz
              const destMap = {};
              const originsSet = new Set();
              
              for (let r = destRowIdx + 1; r < data.length; r++) {
                const row = data[r];
                if (!row) continue;
                
                // Columna A (index 0) o Columna B (index 1) - vamos a buscar en ambas
                let origenRaw = row[1];
                let usedCol = 1;
                if (!origenRaw || String(origenRaw).trim() === '') {
                  origenRaw = row[0];
                  usedCol = 0;
                }
                
                if (origenRaw === undefined || origenRaw === null) break;
                const origen = String(origenRaw).trim();
                if (!origen) break;
                
                // Si la celda evaluada a numero y es un porcentaje (ej: 0.1333) o numero flotante, descartar
                if (!isNaN(Number(origen)) && origen !== '') {
                  continue;
                }
                
                const origenUpper = origen.toUpperCase();
                // Parar en TOTAL, PARTICIPACION, etc.
                if (origenUpper === 'TOTAL' || origenUpper === 'TOTALES' || 
                    origenUpper.includes('PARTICIPACI') || origenUpper.includes('%')) {
                  break;
                }
                
                originsSet.add(origen);
                
                for (const dest of destinoHeaders) {
                  const cellVal = row[dest.col];
                  if (cellVal === undefined || cellVal === null) continue;
                  const num = Number(cellVal);
                  if (isNaN(num) || num <= 0) continue;
                  
                  // REDONDEAR a entero (el Excel puede tener fórmulas con decimales)
                  const rounded = Math.round(num);
                  if (rounded <= 0) continue;
                  
                  if (!destMap[dest.name]) {
                    destMap[dest.name] = { name: dest.name };
                  }
                  if (!destMap[dest.name][origen]) {
                    destMap[dest.name][origen] = 0;
                  }
                  destMap[dest.name][origen] += rounded;
                }
              }
              
              console.log(`[OD Parser] Orígenes encontrados: ${Array.from(originsSet).join(', ')}`);
              console.log(`[OD Parser] Destinos con datos: ${Object.keys(destMap).length}`);
              
              return {
                data: Object.values(destMap),
                origins: Array.from(originsSet)
              };
            };

            const odLivianos = extractODMatrix(vlivSheetName);
            const odPesados = extractODMatrix(vpesSheetName);

            if (odLivianos.data.length > 0 || odPesados.data.length > 0) {
              if (odLivianos.data.length > 0) extractedDataToSave.odLivianos = odLivianos;
              if (odPesados.data.length > 0) extractedDataToSave.odPesados = odPesados;
              extractedDataToSave.odPairs = true; // Flag para compatibilidad
            }
          } catch(err) { console.warn("Error al extraer Encuesta Origen-Destino", err); }

          // --- 3. ENCUESTA DE VELOCIDAD ---
          try {
            const velSheetName = workbook.SheetNames.find(n => /VEL/i.test(n));
            if (velSheetName) {
              const ws = workbook.Sheets[velSheetName];
              const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
              
              let headerRowIdx = -1;
              let labelsRange = [];
              let dataRowIdx = -1;
              let speedDistribution = [];

              for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i] || [];
                const hasRanges = row.some(cell => typeof cell === 'string' && (cell.includes('0-20') || cell.includes('20-30') || cell.includes('30-40')));
                if (hasRanges) {
                  headerRowIdx = i;
                  labelsRange = row.map(c => c ? String(c).trim() : '');
                  for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
                     const dataRow = jsonData[j] || [];
                     const hasNumbers = dataRow.some(cell => typeof cell === 'number' && cell > 0);
                     if (hasNumbers) {
                        dataRowIdx = j;
                        break;
                     }
                  }
                  break;
                }
              }

              if (headerRowIdx !== -1 && dataRowIdx !== -1) {
                 const dataRow = jsonData[dataRowIdx];
                 let totalVelSum = 0;
                 
                 for (let k = 0; k < labelsRange.length; k++) {
                    const label = labelsRange[k];
                    if (label && (label.includes('-') || label.includes('<') || label.includes('>'))) {
                       const val = Number(dataRow[k]) || 0;
                       totalVelSum += val;
                       speedDistribution.push({ rango: label, vehiculos: val });
                    }
                 }
                 
                 if (totalVelSum > 0) {
                    extractedDataToSave.speedDistribution = speedDistribution;
                    extractedDataToSave.speedStats = { vMedia: 60, v85: 75, vDiseno: 60 };
                 }
              }
            }
          } catch(err) { console.warn("Error al extraer Encuesta Velocidad", err); }

          // --- 4. CENSO DE CARGAS (PRODUCTOS) ---
          try {
            const extractProducts = (className) => {
              let expectedStation = '';
              if (selectedEntity?.nombre) {
                const matchE = selectedEntity.nombre.match(/E-(\d+)/i);
                if (matchE) {
                  expectedStation = matchE[1].replace(/^0+/, '');
                } else {
                  const matchEst = selectedEntity.nombre.match(/Estaci[oó]n\s*0*(\d+)/i);
                  if (matchEst) expectedStation = matchEst[1];
                }
              }
              
              if (!expectedStation) {
                 console.warn(`No se pudo determinar el número de estación a partir del nombre: ${selectedEntity?.nombre}. No se extraerá Cargas ${className}.`);
                 return [];
              }

              const regexStr = `CARG.*E${expectedStation}.*${className}`;
              let sheetName = workbook.SheetNames.find(n => new RegExp(regexStr, 'i').test(n));
              
              if (!sheetName) return [];
              const ws = workbook.Sheets[sheetName];
              
              // V1 uses exactly I6:I19 for labels and J6:J19 for data
              const rawLabels = XLSX.utils.sheet_to_json(ws, { range: 'I6:I19', header: 1 }).map(r => r[0]);
              const rawData = XLSX.utils.sheet_to_json(ws, { range: 'J6:J19', header: 1 }).map(r => r[0] || 0);
              
              const results = [];
              let totalSum = 0;
              for(let i = 0; i < rawLabels.length; i++) {
                 if (rawLabels[i]) {
                    const val = Number(rawData[i]) || 0;
                    totalSum += val;
                    results.push({ name: String(rawLabels[i]), value: val });
                 }
              }
              
              if (totalSum === 0) return [];
              return results;
            };

            const ce2Products = extractProducts('CE2');
            const ce3Products = extractProducts('CE3');

            extractedDataToSave.cargasCE2 = ce2Products;
            extractedDataToSave.cargasCE3 = ce3Products;
          } catch(err) { console.warn("Error al extraer Censo de Cargas", err); }
          
          // --- 5. EJES EQUIVALENTES ---
          try {
            let expectedTramo = '1';
            if (selectedEntity?.nombre) {
               const match = selectedEntity.nombre.match(/T-(\d+)/i);
               if (match) expectedTramo = match[1].replace(/^0+/, '');
            }
            const regexStr = `EE.*TRAMO ${expectedTramo}`;
            let sheetName = workbook.SheetNames.find(n => new RegExp(regexStr, 'i').test(n));
            if (!sheetName) sheetName = workbook.SheetNames.find(n => /EE.*TRAMO/i.test(n));

            if (sheetName) {
              const ws = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
              
              // Buscar dinámicamente el inicio de la tabla (fila que contenga 'L3', 'L5', 'M1', 'N1')
              let startRow = -1;
              for (let i = 0; i < jsonData.length; i++) {
                 const row = jsonData[i] || [];
                 const rowStr = row.join(' ').toUpperCase();
                 if (rowStr.includes('L3') && rowStr.includes('M1')) {
                    startRow = i;
                    break;
                 }
              }
              
              if (startRow !== -1) {
                 // Retrocedemos unas filas para agarrar los encabezados principales (TIPO DE VEHICULOS, etc)
                 let actualStart = Math.max(0, startRow - 2);
                 // Buscamos hasta encontrar una fila que parezca el final (ej. "Índice Medio Diario" o fila vacía prolongada)
                 let endRow = actualStart + 20; // fallback
                 for (let i = startRow + 1; i < jsonData.length; i++) {
                    const row = jsonData[i] || [];
                    const rowStr = row.join(' ').toUpperCase();
                    if (rowStr.includes('INDICE MEDIO DIARIO') || rowStr.includes('ÍNDICE MEDIO DIARIO')) {
                       endRow = Math.min(jsonData.length - 1, i + 3); // Agarramos unas filas extra después del total
                       break;
                    }
                 }
                 
                 const processedData = [];
                 let maxCols = 0;
                 for (let i = actualStart; i <= endRow; i++) {
                    const row = jsonData[i] || [];
                    processedData.push(row.map(c => c !== undefined && c !== null ? String(c) : ''));
                    if (row.length > maxCols) maxCols = row.length;
                 }
                 
                 const normalizedData = processedData.map(row => {
                    while (row.length < maxCols) row.push('');
                    return row;
                 });
                 
                 // Recrear los merges para la vista (aproximado, usando celdas repetidas en la primera fila como pista si es necesario, o simplemente sin merges complejos)
                 // Como estamos haciendo extracción dinámica, obviaremos los merges complejos para no romper la tabla de V1.
                 
                 if (normalizedData.length > 0) {
                    extractedDataToSave.ejesEquivalentes = {
                      tableData: normalizedData,
                      title: 'Cálculo de Ejes Equivalentes',
                      merges: []
                    };
                 }
              }
            }
          } catch(err) { console.warn("Error al extraer Ejes Equivalentes", err); }
          if (Object.keys(extractedDataToSave).length > 0 && setExtractedTrafficData) {
            setExtractedTrafficData(prev => ({
              ...prev,
              [entityId]: {
                ...(prev[entityId] || {}),
                ...extractedDataToSave
              }
            }));
          }
          resolve(extractedDataToSave);
        } catch (err) {
          console.error("Error parsing Excel:", err);
          resolve(null);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Selecciona un archivo Excel para continuar.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append(moduleConfig.entityIdName, entityId);
      if (groupDescription) {
        formData.append('description', groupDescription);
      }

      // Endpoint dedicado para excel
      const endpoint = `/api/trafico/${moduleConfig.id.replace(/_/g, '')}/upload-excel`;

      // Smart Extractor for Excel files
      const extractedData = await processExcelData(selectedFile);

      // Add the extracted data JSON to formData so backend can save it
      if (extractedData && Object.keys(extractedData).length > 0) {
        formData.append('extractedData', JSON.stringify(extractedData));
      }

      await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedFile(null);
      setGroupDescription('');
      onClose();
    } catch (error) {
      console.error('Error cargando el Excel de Tráfico V2:', error);
      alert('No se pudo completar la carga. Revisa el archivo o el endpoint configurado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="traffic-v2-modal-overlay">
      <div className="traffic-v2-modal">
        <div className="traffic-v2-modal-header">
          <div>
            <h3>Subir Excel de Datos</h3>
            <p>{moduleConfig.label} · {entityId}</p>
          </div>
          <button type="button" className="traffic-v2-close-btn" onClick={onClose}>&times;</button>
        </div>

        <label className="traffic-v2-field">
          Descripción o Comentarios (Opcional)
          <input
            type="text"
            value={groupDescription}
            onChange={(event) => setGroupDescription(event.target.value)}
            placeholder="Ej: archivo procesado de campo"
          />
        </label>

        <div
          className={`traffic-v2-dropzone ${isDragging ? 'dragging' : ''}`}
          style={{ minHeight: '120px' }}
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={acceptedFileTypes}
            onChange={(event) => handleFileSelection(event.target.files)}
          />
          <strong>Arrastra el archivo Excel o selecciónalo</strong>
          <span>El Excel servirá como fuente para generar los reportes y se guardará de forma separada en NAS.</span>
        </div>

        {selectedFile ? (
          <div className="traffic-v2-selected-files">
            <div className="traffic-v2-selected-file">
              <span>{selectedFile.name}</span>
              <button type="button" onClick={() => setSelectedFile(null)}>
                Quitar
              </button>
            </div>
          </div>
        ) : null}

        <div className="traffic-v2-modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary" onClick={handleUpload} disabled={isLoading || !selectedFile}>
            {isLoading ? 'Cargando y Procesando...' : 'Subir Excel y Generar Gráficos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficExcelUploadModal;
