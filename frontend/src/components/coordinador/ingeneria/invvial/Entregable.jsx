import React from 'react';

const Entregable = ({ numero, activeTab, setActiveTab }) => {
  const tabs = [`Entregable ${numero} - Tab A`, `Entregable ${numero} - Tab B`];

  return (
    <>
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'auto' }}>
        {activeTab === tabs[0] && <p>Contenido del {numero}er Entregable - Tab A</p>}
        {activeTab === tabs[1] && <p>Contenido del {numero}er Entregable - Tab B</p>}
      </div>
    </>
  );
};

export default Entregable;
