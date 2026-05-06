import React from 'react';
import { useParams } from 'react-router-dom';
import EnsayoDetallePanel from './EnsayoDetallePanel.jsx';

export default function DetalleEnsayo() {
  const { ensayoId } = useParams();

  return <EnsayoDetallePanel ensayoId={ensayoId} />;
}
