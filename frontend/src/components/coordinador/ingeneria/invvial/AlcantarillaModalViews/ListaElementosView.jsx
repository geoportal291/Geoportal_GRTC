import React from 'react';
import '../obras/ListaAlcantarillasModal.css';

const viewConfig = {
  alcantarillas: {
    title: 'Alcantarillas Existentes',
    headers: ['Código', 'Tipo', 'Diámetro/Lado', 'Longitud', 'Progresiva', 'Estado', 'Acciones'],
    fields: ['codigo', 'tipo', 'diametro_lado', 'longitud_alcantarilla', 'progresiva', 'estado'],
    keyField: 'id_alcantarilla',
  },
  badenes: {
    title: 'Badenes Existentes',
    headers: ['Código', 'Tipo', 'Diámetro/Lado', 'Longitud', 'Progresiva', 'Estado', 'Acciones'],
    fields: ['codigo', 'tipo', 'diametro_lado', 'longitud_baden', 'progresiva', 'estado'],
    keyField: 'id_baden',
  },
  puentes: {
    title: 'Puentes Existentes',
    headers: ['Nombre', 'Progresiva', 'Clase', 'Tipo', 'Longitud', 'Ancho', 'Estado', 'Acciones'],
    fields: ['nombre', 'progresiva', 'clase', 'tipo', 'longitud_puente', 'ancho', 'estado'],
    keyField: 'id_puente',
  },
  muros: {
    title: 'Muros Existentes',
    headers: ['Progresiva', 'Clase', 'Lado', 'Longitud', 'Alto', 'Estado', 'Acciones'],
    fields: ['progresiva', 'clase', 'lado', 'longitud_muro', 'alto', 'estado'],
    keyField: 'id_muro',
  },
};

const ListaElementosView = ({
  allData,
  handleCreateNewClick,
  handleEditClick,
  setModalViewMode,
  type = 'alcantarillas', // Default to alcantarillas
}) => {
  const config = viewConfig[type] || viewConfig.alcantarillas;

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      const fieldA = a.codigo || a.progresiva || a.nombre || '';
      const fieldB = b.codigo || b.progresiva || b.nombre || '';
      
      const numA = parseInt(String(fieldA).match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(String(fieldB).match(/\d+/)?.[0] || '0', 10);

      if (numA !== numB) {
        return numA - numB;
      }
      return String(fieldA).localeCompare(String(fieldB));
    });
  };

  const sortedData = sortData(allData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
        <button onClick={handleCreateNewClick} className="modal-button-create">Crear Nuevo Elemento</button>
        <button onClick={() => setModalViewMode('upload_excel')} className="modal-button-upload">Subir Excel</button>
        <button onClick={() => setModalViewMode('upload_graphics_excel')} className="modal-button-images">Subir Imágenes</button>
      </div>
      
      <h3 style={{ marginBottom: '15px', color: '#555' }}>{config.title}</h3>
      {sortedData && sortedData.length > 0 ? (
        <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
              <tr>
                {config.headers.map(header => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((element) => (
                <tr key={element[config.keyField]} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {config.fields.map(field => <td key={field}>{element[field]}</td>)}
                  <td>
                    <button onClick={() => handleEditClick(element)} className="modal-button-edit">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-data-message">
          <p>¡No hay {type} para mostrar!</p>
          <p>Puedes crear uno nuevo manualmente o subir datos desde un archivo Excel.</p>
        </div>
      )}
    </div>
  );
};

export default ListaElementosView;
