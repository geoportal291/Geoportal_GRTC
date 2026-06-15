import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../api/axios';
import { useAuth } from '../../../../data/contexts/AuthContext';
import { usePageTitle } from '../../../contexts/PageTitleContext';
import TraficoV2Internal from './TraficoV2Internal';
import TraficoV2External from './TraficoV2External';
import TrafficViewSelectionModal from './components/TrafficViewSelectionModal';
import { buildTrafficV2Dataset } from './trafficV2Utils';
import './traficoV2.css';

const STORAGE_KEY = 'traficoV2ViewMode';

const TraficoV2 = () => {
  const { user, selectedProjectId, selectedProjectName } = useAuth();
  const { setPageTitle } = usePageTitle();
  const [viewMode, setViewMode] = useState(() => window.localStorage.getItem(STORAGE_KEY) || null);
  const [rawRows, setRawRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const CACHE_KEY = `geoportal_traffic_v2_extracted_${selectedProjectId || 'default'}`;

  const [extractedTrafficData, setExtractedTrafficData] = useState(() => {
    try {
      const cached = window.localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  // Sync to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(extractedTrafficData).length > 0) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(extractedTrafficData));
    }
  }, [extractedTrafficData, CACHE_KEY]);

  useEffect(() => {
    setPageTitle('Área de Tráfico V2');
  }, [setPageTitle]);

  useEffect(() => {
    if (viewMode) {
      window.localStorage.setItem(STORAGE_KEY, viewMode);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [viewMode]);

  const loadTrafficData = async () => {
    if (!user?.token || !selectedProjectId) {
      setRawRows([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/api/elementos-trafico?proyectoId=${selectedProjectId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      const fetchedData = Array.isArray(response.data) ? response.data : [];
      setRawRows(fetchedData);

      // Cargar datos_extraidos de la base de datos al estado
      // Cargar datos_extraidos de la base de datos al estado
      const newExtracted = { ...extractedTrafficData }; // Empezamos con lo que haya en caché
      let hasDbData = false;
      fetchedData.forEach(item => {
         if (item.datos_extraidos) {
            newExtracted[item.id] = { ...newExtracted[item.id], ...item.datos_extraidos };
            hasDbData = true;
         }
      });
      // Solo forzamos la actualización si la DB nos mandó algo nuevo que no teníamos, 
      // o si la caché estaba vacía, para no sobrescribir la caché con nada.
      if (hasDbData || Object.keys(extractedTrafficData).length === 0) {
         setExtractedTrafficData(newExtracted);
      }
    } catch (loadError) {
      console.error('Error cargando Tráfico V2:', loadError);
      setError('No se pudieron cargar los datos de tráfico para la V2.');
      setRawRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrafficData();
  }, [selectedProjectId, user?.token]);

  const dataset = useMemo(() => buildTrafficV2Dataset(rawRows), [rawRows]);
  const handleSwitchMode = (nextMode) => setViewMode(nextMode);
  const handleBack = () => setViewMode(null);

  if (viewMode === 'internal') {
    return (
      <TraficoV2Internal
        projectName={selectedProjectName}
        projectId={selectedProjectId}
        dataset={dataset}
        isLoading={isLoading}
        error={error}
        onReload={loadTrafficData}
        onBack={handleBack}
        onSwitchMode={handleSwitchMode}
        extractedTrafficData={extractedTrafficData}
        setExtractedTrafficData={setExtractedTrafficData}
      />
    );
  }

  if (viewMode === 'external') {
    return (
      <TraficoV2External
        projectName={selectedProjectName}
        dataset={dataset}
        isLoading={isLoading}
        error={error}
        onBack={handleBack}
        onSwitchMode={handleSwitchMode}
      />
    );
  }

  return <TrafficViewSelectionModal onSelect={setViewMode} projectName={selectedProjectName} />;
};

export default TraficoV2;
