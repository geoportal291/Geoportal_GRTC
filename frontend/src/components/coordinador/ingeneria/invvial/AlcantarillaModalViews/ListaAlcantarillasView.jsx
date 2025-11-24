import React from 'react';

const ListaAlcantarillasView = ({
  allAlcantarillasData,
  handleCreateNewClick,
  handleEditClick,
  setModalViewMode,
  setUploadStatus,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
        <button onClick={handleCreateNewClick} style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'background-color 0.2s ease'
        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Crear Nuevo Elemento</button>
        <button onClick={() => setModalViewMode('upload_excel')} style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'background-color 0.2s ease'
        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}>Subir Excel</button>
        <button onClick={() => setModalViewMode('upload_graphics_excel')} style={{
          backgroundColor: '#17a2b8',
          color: 'white',
          padding: '12px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'background-color 0.2s ease'
        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#138496'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}>Subir Imágenes</button>
      </div>
      
      <h3 style={{ marginBottom: '15px', color: '#555' }}>Elementos Existentes</h3>
      {allAlcantarillasData && allAlcantarillasData.length > 0 ? (
        <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Código</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Tipo</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Diámetro/Lado</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Longitud</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Progresiva</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Estado</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allAlcantarillasData.sort((a, b) => {
                const numA = parseInt(a.codigo.match(/\d+/)?.[0] || '0', 10);
                const numB = parseInt(b.codigo.match(/\d+/)?.[0] || '0', 10);
                return numA - numB;
              }).map((element) => (
                <tr key={element.id_alcantarilla} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.codigo}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.tipo}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.diametro_lado}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.longitud_alcantarilla}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.progresiva}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.estado}</td>
                  <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>
                    <button onClick={() => handleEditClick(element)} style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '8px 15px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      transition: 'background-color 0.2s ease'
                    }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#777',
          padding: '20px',
          border: '1px dashed #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          marginTop: '20px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '1.1em', fontWeight: 'bold' }}>¡No hay alcantarillas para mostrar!</p>
          <p style={{ margin: '0', fontSize: '0.9em' }}>Puedes crear una nueva manualmente o subir datos desde un archivo Excel.</p>
        </div>
      )}
    </div>
  );
};

export default ListaAlcantarillasView;
