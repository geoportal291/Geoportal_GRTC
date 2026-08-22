import { useMemo, useState } from 'react';
import TraficoV2Layout from './TraficoV2Layout';
import ResumenGeneralV2 from './tabs/ResumenGeneralV2';
import RecoleccionProcesamientoV2 from './tabs/RecoleccionProcesamientoV2';
import ReporteFinalV2 from './tabs/ReporteFinalV2';
import {
  TOP_LEVEL_TABS,
  SUMMARY_SUBTABS,
  PROCESSING_SUBTABS,
  REPORT_SUBTABS
} from './trafficV2Utils';

const defaultSubtabByTopLevel = {
  resumen: SUMMARY_SUBTABS[0].id,
  procesamiento: PROCESSING_SUBTABS[0].id,
  reporte: REPORT_SUBTABS[0].id
};

  const TraficoV2Internal = ({
    projectName,
    projectId,
    dataset,
    isLoading,
    error,
    onReload,
    onBack,
    onSwitchMode,
    extractedTrafficData,
    setExtractedTrafficData
  }) => {
    const [activeTopTab, setActiveTopTab] = useState('resumen');
    const [activeSubTab, setActiveSubTab] = useState(defaultSubtabByTopLevel.resumen);
  
    const currentSubTabs = useMemo(() => {
      if (activeTopTab === 'procesamiento') return PROCESSING_SUBTABS;
      if (activeTopTab === 'reporte') return REPORT_SUBTABS;
      return SUMMARY_SUBTABS;
    }, [activeTopTab]);
  
    const handleTopTabChange = (nextTopTab) => {
      setActiveTopTab(nextTopTab);
      setActiveSubTab(defaultSubtabByTopLevel[nextTopTab]);
    };
  
    const modeOptions = [
      {
        id: 'internal',
        label: 'Gestión Interna',
        active: true,
        onClick: onSwitchMode
      },
      {
        id: 'external',
        label: 'Vista Externa',
        active: false,
        onClick: onSwitchMode
      }
    ];
  
    const renderCurrentView = () => {
      if (isLoading) {
        return <div className="traffic-v2-loader">Cargando información de Tráfico V2...</div>;
      }
  
      if (error) {
        return <div className="traffic-v2-error-box">{error}</div>;
      }
  
      if (activeTopTab === 'procesamiento') {
        return (
          <RecoleccionProcesamientoV2
            activeSubTab={activeSubTab}
            stations={dataset.stations}
            sections={dataset.sections}
            onReload={onReload}
            extractedTrafficData={extractedTrafficData}
            setExtractedTrafficData={setExtractedTrafficData}
          />
        );
      }
  
      if (activeTopTab === 'reporte') {
        return (
          <ReporteFinalV2
            activeSubTab={activeSubTab}
            stations={dataset.stations}
            sections={dataset.sections}
            extractedTrafficData={extractedTrafficData}
            setExtractedTrafficData={setExtractedTrafficData}
          />
        );
      }

    return (
      <ResumenGeneralV2
        activeSubTab={activeSubTab}
        projectId={projectId}
        stations={dataset.stations}
        sections={dataset.sections}
        summary={dataset.summary}
        extractedTrafficData={extractedTrafficData}
      />
    );
  };

  return (
    <TraficoV2Layout
      title="Área de Tráfico"
      projectName={projectName}
      topTabs={TOP_LEVEL_TABS}
      activeTopTab={activeTopTab}
      onTopTabChange={handleTopTabChange}
      subTabs={currentSubTabs}
      activeSubTab={activeSubTab}
      onSubTabChange={setActiveSubTab}
      modeLabel="Gestión Interna"
      onBack={onBack}
      modeOptions={modeOptions}
    >
      {renderCurrentView()}
    </TraficoV2Layout>
  );
};

export default TraficoV2Internal;
