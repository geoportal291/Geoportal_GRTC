import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '@/api/axios';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';

const EjesEquivalentesModal = ({ isOpen, onClose, selectedSection, isNavbarExpanded }) => {
  const [excelTableData, setExcelTableData] = useState([]);
  const [tableTitle, setTableTitle] = useState('');
  const [merges, setMerges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sectionTableConfig = {
    'T-1': {
      sheetName: 'R. EE. TRAMO 1',
      dataRange: 'A33:Y53',
    },
    'T-2': {
      sheetName: 'R. EE. TRAMO 2',
      dataRange: 'A33:Y53', // Please adjust if the range is different
    },
    'T-3': {
      sheetName: 'R. EE. TRAMO 3',
      dataRange: 'A33:Y53', // Please adjust if the range is different
    },
  };

  useEffect(() => {
    const fetchExcelData = async () => {
      if (!isOpen || !selectedSection) {
        setExcelTableData([]);
        setTableTitle('');
        setMerges([]);
        return;
      }

      setIsLoading(true);
      setExcelTableData([]);
      setTableTitle('');
      setMerges([]);

      const currentSectionConfig = sectionTableConfig[selectedSection];

      if (!currentSectionConfig) {
        console.warn(`No hay configuración de tabla para el tramo: ${selectedSection}`);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/api/trafico/conteovehicular/latest-excel/E-01`);
        if (response.data.status === 'ok') {
          const excelUrl = response.data.excelUrl;

          const excelFileResponse = await axiosInstance.get(`/api/trafico/download-excel?url=${encodeURIComponent(excelUrl)}`, { responseType: 'arraybuffer' });
          const data = new Uint8Array(excelFileResponse.data);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = currentSectionConfig.sheetName;
          const worksheet = workbook.Sheets[sheetName];

          if (worksheet) {
            const range = XLSX.utils.decode_range(currentSectionConfig.dataRange);
            const processedData = [];
            let maxCols = 0;

            // Iterate through rows and columns to get all cell values
            for (let R = range.s.r; R <= range.e.r; ++R) {
              const row = [];
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cell_address];
                row.push(cell ? cell.v : ''); // Use empty string for blank cells
              }
              processedData.push(row);
              if (row.length > maxCols) maxCols = row.length;
            }

            // Normalize row lengths
            const normalizedData = processedData.map(row => {
              while (row.length < maxCols) {
                row.push('');
              }
              return row;
            });

            if (normalizedData.length > 0) {
              setTableTitle(normalizedData[0][1]); // Title is in the second cell of the first row
              setExcelTableData(normalizedData);

              const merges = (worksheet['!merges'] || []).map(merge => ({
                s: { r: merge.s.r - range.s.r, c: merge.s.c - range.s.c },
                e: { r: merge.e.r - range.s.r, c: merge.e.c - range.s.c },
              }));
              setMerges(merges);
            }
          } else {
            console.error(`La hoja "${sheetName}" no se encontró.`);
          }
        } else {
          alertify.error('Error al obtener la URL del archivo Excel.');
        }
      } catch (error) {
        console.error('Error fetching Excel data:', error);
        alertify.error('Error al cargar los datos del Excel.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExcelData();
  }, [isOpen, selectedSection]);

  const renderTable = () => {
    const isStartOfMerge = (rowIndex, colIndex) => {
      return merges.some(merge => merge.s.r === rowIndex && merge.s.c === colIndex);
    }

    const isInMerge = (rowIndex, colIndex) => {
      return merges.some(merge => 
        rowIndex >= merge.s.r && rowIndex <= merge.e.r &&
        colIndex >= merge.s.c && colIndex <= merge.e.c
      );
    }

    const getMergeProps = (rowIndex, colIndex) => {
      const merge = merges.find(merge => merge.s.r === rowIndex && merge.s.c === colIndex);
      if (merge) {
        return {
          colSpan: (merge.e.c - merge.s.c) + 1,
          rowSpan: (merge.e.r - merge.s.r) + 1,
        };
      }
      return {};
    }

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {excelTableData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => {
                if (isInMerge(rowIndex, colIndex) && !isStartOfMerge(rowIndex, colIndex)) {
                  return null;
                }
                
                const style = {
                  border: '1px solid #ddd',
                  padding: '4px 6px', // Reduced padding
                  fontSize: '12px', // Smaller font size
                  whiteSpace: 'nowrap', // Prevent text wrapping
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center', // Center all text
                  backgroundColor: 'white', // Default background for all cells
                };

                // Apply header style to rows 1 and 2 (0-indexed from processed data)
                if (rowIndex >= 1 && rowIndex <= 2) {
                  style.backgroundColor = '#f2f2f2';
                  style.fontWeight = 'bold';
                }
                
                let displayCell = cell;
                if (typeof cell === 'number') {
                  if (Number.isInteger(cell)) {
                    displayCell = cell; // Keep integers as is
                  } else {
                    displayCell = cell.toFixed(2); // Round non-integers to 2 decimal places
                  }
                } else if (typeof cell === 'string' && !isNaN(parseFloat(cell)) && isFinite(cell)) {
                  const num = parseFloat(cell);
                  if (Number.isInteger(num)) {
                    displayCell = num; // Keep integer strings as is
                  } else {
                    displayCell = num.toFixed(2); // Round non-integer strings to 2 decimal places
                  }
                }
                
                return (
                  <td key={colIndex} {...getMergeProps(rowIndex, colIndex)} style={style}>{displayCell}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        maxWidth: isNavbarExpanded ? '80%' : '90%',
        maxHeight: '90%',
        overflow: 'auto',
        position: 'relative',
        transition: 'transform 0.3s ease-in-out',
        transform: isNavbarExpanded ? 'translateX(8%)' : 'translateX(0)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          &times;
        </button>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Cargando datos de ejes equivalentes...</div>
        ) : (
          <>
            {tableTitle && <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>{tableTitle}</h4>}
            {excelTableData.length > 0 ? renderTable() : <p>No hay datos de ejes equivalentes disponibles para este tramo.</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default EjesEquivalentesModal;
