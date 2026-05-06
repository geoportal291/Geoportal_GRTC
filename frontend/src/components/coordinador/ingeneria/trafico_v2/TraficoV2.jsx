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
      setRawRows(Array.isArray(response.data) ? response.data : []);
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
