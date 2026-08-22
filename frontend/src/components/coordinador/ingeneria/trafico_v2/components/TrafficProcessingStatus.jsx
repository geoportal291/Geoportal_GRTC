import { useCallback, useMemo, useState } from 'react';
import axiosInstance from '@/api/axios';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { useAuth } from '@/data/contexts/AuthContext';
import {
  buildProcessingPipeline,
  formatDate,
  getEntityStats,
  matchesAcceptedTypes,
  MODULE_CONFIG
} from '../trafficV2Utils';

const statusLabel = {
  done: 'Completado',
  in_progress: 'En curso',
  pending: 'Pendiente'
};

const isImageFile = (url) => /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(url || '');

const groupAssetsByDescriptionAndDate = (assets) => {
  const grouped = {};
  assets.forEach((asset) => {
    const key = `${asset.description || 'Sin descripción'}::${asset.upload_date || 'sin-fecha'}`;
    if (!grouped[key]) {
      grouped[key] = {
        description: asset.description || 'Sin descripción',
        upload_date: asset.upload_date,
        items: []
      };
    }
    grouped[key].items.push(asset);
  });
  return Object.values(grouped).sort(
    (a, b) => new Date(b.upload_date || 0) - new Date(a.upload_date || 0)
  );
};

const TrafficProcessingStatus = ({
  entity,
  moduleKey,
  moduleLabel,
  className = '',
  onReload,
  extractedTrafficData,
  setExtractedTrafficData
}) => {
  const { user } = useAuth();
  const userRole = String(user?.role || user?.rol_nombre || user?.rol || '').toUpperCase();
  const isReviewer = ['ADMIN', 'COORDINADOR PROYECTO', 'COORDINADOR', 'ENCARGADO'].includes(userRole);

  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [activeSection, setActiveSection] = useState('photos'); // 'photos' | 'files' | 'pipeline'

  const moduleConfig = MODULE_CONFIG[moduleKey];

  const stats = useMemo(
    () => (entity ? getEntityStats(entity, moduleKey) : null),
    [entity, moduleKey]
  );

  const pipeline = useMemo(
    () => (entity ? buildProcessingPipeline(entity, moduleKey) : []),
    [entity, moduleKey]
  );

  // Separate photos vs analytical files
  const photoAssets = useMemo(() => {
    if (!stats?.assets) return [];
    return stats.assets.filter((asset) => {
      const type = String(asset.source_type || '');
      return (
        type.includes('_image') ||
        type === 'estacion_control' ||
        type === 'tramo' ||
        (!type.includes('_file') && !type.includes('excel') && isImageFile(asset.image_url))
      );
    });
  }, [stats]);

  const fileAssets = useMemo(() => {
    if (!stats?.assets) return [];
    return stats.assets.filter((asset) => {
      const type = String(asset.source_type || '');
      return type.includes('_file') || type.includes('excel');
    });
  }, [stats]);

  const photoGroups = useMemo(() => groupAssetsByDescriptionAndDate(photoAssets), [photoAssets]);
  const fileGroups = useMemo(() => groupAssetsByDescriptionAndDate(fileAssets), [fileAssets]);

  // Determine entity ID name for delete calls
  const entityIdName = moduleConfig?.entityIdName || 'stationId';

  const handleDeleteFile = useCallback(
    (imageUrl, description) => {
      if (!entity) return;
      alertify.confirm(
        'Eliminar Archivo',
        `¿Seguro que quieres eliminar "${description || imageUrl?.split('/').pop()}"?`,
        async () => {
          try {
            await axiosInstance.delete('/api/trafico/delete-image', {
              data: { [entityIdName]: entity.id, imageUrl }
            });
            alertify.success('Archivo eliminado correctamente.');
            if (onReload) onReload();
          } catch (err) {
            console.error('Error eliminando archivo:', err);
            alertify.error('No se pudo eliminar el archivo.');
          }
        },
        () => alertify.message('Eliminación cancelada.')
      );
    },
    [entity, entityIdName, onReload]
  );

  const handleDeleteGroup = useCallback(
    (description, uploadDate) => {
      if (!entity) return;
      alertify.confirm(
        'Eliminar Grupo',
        `¿Eliminar todos los archivos del grupo "${description}" (${formatDate(uploadDate)})?`,
        async () => {
          try {
            await axiosInstance.delete('/api/trafico/delete-image-group', {
              data: {
                [entityIdName]: entity.id,
                description,
                uploadDate
              }
            });
            alertify.success('Grupo eliminado correctamente.');
            if (onReload) onReload();
          } catch (err) {
            console.error('Error eliminando grupo:', err);
            alertify.error('No se pudo eliminar el grupo.');
          }
        },
        () => alertify.message('Eliminación cancelada.')
      );
    },
    [entity, entityIdName, onReload]
  );

  const latestExcelUrl = useMemo(() => {
    if (!fileAssets || fileAssets.length === 0) return null;
    const sorted = [...fileAssets].sort((a, b) => new Date(b.upload_date || 0) - new Date(a.upload_date || 0));
    return sorted[0]?.image_url;
  }, [fileAssets]);

  const dataForEntity = extractedTrafficData ? extractedTrafficData[entity?.id] : null;
  const hasExtractedData = useMemo(() => {
    // Si hay Excels subidos en la base de datos (archivos), mostrar el panel
    if (stats?.excelCount > 0) return true;
    
    if (!dataForEntity) return false;
    if (moduleKey === 'encuesta_velocidad' && dataForEntity.v85 > 0) return true;
    if (moduleKey === 'conteo_vehicular' && dataForEntity.imda > 0) return true;
    if ((moduleKey === 'encuesta_origen_destino' || moduleKey === 'censo_de_cargas') && dataForEntity.classificationData?.length > 0) return true;
    // Fallback: si hay data extraida
    return !!dataForEntity.isRealData;
  }, [dataForEntity, moduleKey, stats]);

  const currentStatus = dataForEntity?.moduleStatus?.[moduleKey] || 'pending';

  const handleUpdateStatus = (newStatus) => {
    if (!setExtractedTrafficData) return;
    
    setExtractedTrafficData(prev => {
      const next = { ...prev };
      if (!next[entity.id]) {
        next[entity.id] = {};
      }
      if (!next[entity.id].moduleStatus) {
        next[entity.id].moduleStatus = {};
      }
      next[entity.id].moduleStatus[moduleKey] = newStatus;
      return next;
    });
    
    if (newStatus === 'approved') {
      alertify.success('Módulo Aprobado exitosamente.');
    } else if (newStatus === 'rejected') {
      alertify.error('Módulo Rechazado. Se ha notificado la irregularidad.');
    } else {
      alertify.message('Estado reiniciado a Pendiente.');
    }
  };

  if (!entity) {
    return (
      <section className={`traffic-v2-panel ${className}`.trim()}>
        <div className="traffic-v2-empty-state">
          Selecciona una entidad para revisar el estado de procesamiento.
        </div>
      </section>
    );
  }

  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      {/* Header */}
      <div className="traffic-v2-panel-header">
        <div>
          <h3>{entity.nombre || entity.id} — {moduleLabel}</h3>
          <p>Gestión dinámica de archivos cargados, pipeline de procesamiento y galería de fotos.</p>
        </div>
      </div>

      {/* Workflow Approval Panel */}
      {hasExtractedData && (
        <div style={{ 
          margin: '0 0 20px 0', 
          padding: '16px', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: currentStatus === 'approved' ? '1px solid #bbf7d0' : currentStatus === 'rejected' ? '1px solid #fecaca' : '1px solid #fef08a',
          backgroundColor: currentStatus === 'approved' ? '#f0fdf4' : currentStatus === 'rejected' ? '#fef2f2' : '#fefce8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentStatus === 'approved' && <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#16a34a' }}></i>}
            {currentStatus === 'rejected' && <i className="fas fa-times-circle" style={{ fontSize: '1.5rem', color: '#dc2626' }}></i>}
            {currentStatus === 'pending' && <i className="fas fa-exclamation-circle" style={{ fontSize: '1.5rem', color: '#ca8a04' }}></i>}
            
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: currentStatus === 'approved' ? '#166534' : currentStatus === 'rejected' ? '#991b1b' : '#854d0e' }}>
                {currentStatus === 'approved' ? 'Calidad Aprobada' : currentStatus === 'rejected' ? 'Datos Rechazados' : 'Pendiente de Revisión'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: currentStatus === 'approved' ? '#15803d' : currentStatus === 'rejected' ? '#b91c1c' : '#a16207' }}>
                {currentStatus === 'approved' 
                  ? 'La información de este módulo será visible en el Funnel y en los reportes.' 
                  : currentStatus === 'rejected' 
                  ? 'El Excel procesado tiene errores. Requiere corrección por parte del operador.' 
                  : isReviewer 
                    ? 'La data ha sido extraída. Por favor revisa los documentos y aprueba el módulo.'
                    : 'A la espera de la validación del Coordinador para integrar los datos.'}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {latestExcelUrl && (
              <a 
                href={latestExcelUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <i className="fas fa-file-excel"></i> Ver Excel
              </a>
            )}
            
            {isReviewer && currentStatus !== 'approved' && (
              <button 
                onClick={() => handleUpdateStatus('approved')}
                style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-check"></i> Aprobar
              </button>
            )}
            {isReviewer && currentStatus !== 'rejected' && (
              <button 
                onClick={() => handleUpdateStatus('rejected')}
                style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-times"></i> Rechazar
              </button>
            )}
            {isReviewer && currentStatus !== 'pending' && (
              <button 
                onClick={() => handleUpdateStatus('pending')}
                style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Deshacer
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI counters */}
      <div className="traffic-v2-processing-overview">
        <article>
          <span>Registros</span>
          <strong>{stats.totalUploads}</strong>
        </article>
        <article>
          <span>Fotos</span>
          <strong>{stats.imageCount}</strong>
        </article>
        <article>
          <span>Archivos</span>
          <strong>{stats.fileCount}</strong>
        </article>
        <article>
          <span>Excel</span>
          <strong>{stats.excelCount}</strong>
        </article>
        <article>
          <span>Último movimiento</span>
          <strong>{formatDate(stats.lastUpload)}</strong>
        </article>
      </div>

      {/* Section tabs */}
      <div className="tv2-section-tabs">
        <button
          type="button"
          className={`tv2-section-tab ${activeSection === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveSection('photos')}
        >
          <i className="fas fa-images" /> Fotos ({photoAssets.length})
        </button>
        <button
          type="button"
          className={`tv2-section-tab ${activeSection === 'files' ? 'active' : ''}`}
          onClick={() => setActiveSection('files')}
        >
          <i className="fas fa-file-alt" /> Documentos ({fileAssets.length})
        </button>
        <button
          type="button"
          className={`tv2-section-tab ${activeSection === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveSection('pipeline')}
        >
          <i className="fas fa-project-diagram" /> Pipeline
        </button>
      </div>

      {/* Photos section */}
      {activeSection === 'photos' && (
        <div className="tv2-file-section">
          {photoGroups.length === 0 ? (
            <div className="traffic-v2-empty-state" style={{ padding: '20px' }}>
              No hay fotos cargadas para este módulo.
            </div>
          ) : (
            photoGroups.map((group, gi) => (
              <div key={`pg-${gi}`} className="tv2-file-group">
                <div className="tv2-file-group-header">
                  <div className="tv2-file-group-info">
                    <strong>{group.description}</strong>
                    <span>{formatDate(group.upload_date)} · {group.items.length} foto(s)</span>
                  </div>
                  <button
                    type="button"
                    className="tv2-delete-group-btn"
                    onClick={() => handleDeleteGroup(group.description, group.upload_date)}
                  >
                    <i className="fas fa-trash" /> Eliminar Grupo
                  </button>
                </div>
                <div className="tv2-photo-grid">
                  {group.items.map((asset, ai) => (
                    <div key={`pa-${ai}`} className="tv2-photo-thumb">
                      <img
                        src={asset.image_url}
                        alt={asset.description || 'Foto'}
                        onClick={() => setLightboxUrl(asset.image_url)}
                      />
                      <button
                        type="button"
                        className="tv2-photo-delete"
                        onClick={() => handleDeleteFile(asset.image_url, asset.description)}
                        title="Eliminar esta foto"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Files section */}
      {activeSection === 'files' && (
        <div className="tv2-file-section">
          {fileGroups.length === 0 ? (
            <div className="traffic-v2-empty-state" style={{ padding: '20px' }}>
              No hay documentos analíticos cargados para este módulo.
            </div>
          ) : (
            fileGroups.map((group, gi) => (
              <div key={`fg-${gi}`} className="tv2-file-group">
                <div className="tv2-file-group-header">
                  <div className="tv2-file-group-info">
                    <strong>{group.description}</strong>
                    <span>{formatDate(group.upload_date)} · {group.items.length} archivo(s)</span>
                  </div>
                  <button
                    type="button"
                    className="tv2-delete-group-btn"
                    onClick={() => handleDeleteGroup(group.description, group.upload_date)}
                  >
                    <i className="fas fa-trash" /> Eliminar Grupo
                  </button>
                </div>
                <div className="tv2-doc-list">
                  {group.items.map((asset, ai) => {
                    const fileName = asset.image_url?.split('/').pop() || 'archivo';
                    const isImg = isImageFile(asset.image_url);
                    return (
                      <div key={`fa-${ai}`} className="tv2-doc-item">
                        <div className="tv2-doc-icon">
                          <i className={`fas ${isImg ? 'fa-image' : 'fa-file-excel'}`} />
                        </div>
                        <div className="tv2-doc-info">
                          <strong>{asset.description || fileName}</strong>
                          <span>{formatDate(asset.upload_date)} · {asset.source_type}</span>
                        </div>
                        <div className="tv2-doc-actions">
                          <button
                            type="button"
                            className="tv2-doc-action open"
                            onClick={() => {
                              if (isImg) {
                                setLightboxUrl(asset.image_url);
                              } else {
                                window.open(asset.image_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title="Abrir archivo"
                          >
                            <i className="fas fa-external-link-alt" />
                          </button>
                          <button
                            type="button"
                            className="tv2-doc-action delete"
                            onClick={() => handleDeleteFile(asset.image_url, asset.description)}
                            title="Eliminar archivo"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pipeline section */}
      {activeSection === 'pipeline' && (
        <div className="traffic-v2-pipeline">
          {pipeline.map((step) => (
            <div key={step.id} className={`traffic-v2-pipeline-step ${step.status}`}>
              <span className="traffic-v2-pipeline-dot" />
              <div>
                <strong>{step.label}</strong>
                <small>{statusLabel[step.status]}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for fullscreen image */}
      {lightboxUrl && (
        <div className="tv2-lightbox" onClick={() => setLightboxUrl(null)}>
          <button
            type="button"
            className="tv2-lightbox-close"
            onClick={() => setLightboxUrl(null)}
          >
            <i className="fas fa-times" />
          </button>
          <img
            src={lightboxUrl}
            alt="Vista ampliada"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default TrafficProcessingStatus;
