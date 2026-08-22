const TraficoV2Layout = ({
  title,
  projectName,
  topTabs,
  activeTopTab,
  onTopTabChange,
  subTabs,
  activeSubTab,
  onSubTabChange,
  modeLabel,
  onBack,
  modeOptions = [],
  children
}) => {
  return (
    <div className="traffic-v2-page">
      <header className="traffic-v2-header">
        <div className="traffic-v2-header-copy">
          <div className="traffic-v2-header-title-group">
            {onBack ? (
              <button type="button" className="traffic-v2-back-btn" onClick={onBack}>
                Volver
              </button>
            ) : null}
            <h1>{title}</h1>
          </div>
          <span>Proyecto: <strong>{projectName || 'Sin proyecto seleccionado'}</strong></span>
        </div>

        <div className="traffic-v2-top-tabs">
          {topTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`traffic-v2-top-tab ${activeTopTab === tab.id ? 'active' : ''}`}
              onClick={() => onTopTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="traffic-v2-header-actions">
          {modeOptions.length ? (
            <div className="traffic-v2-mode-switch" aria-label="Modo de visualización">
              {modeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`traffic-v2-mode-switch-btn ${option.active ? 'active' : ''}`}
                  onClick={() => option.onClick(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <nav className="traffic-v2-subtabs">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`traffic-v2-subtab ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => onSubTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="traffic-v2-content">
        {children}
      </main>
    </div>
  );
};

export default TraficoV2Layout;
