import React from 'react';
import GestorDeMateriales from './GestorDeMateriales';

export default function GestorDeMaterialesContainer() {
  return (
    <div className="gestor-materiales-container-wrapper">
      {/* Aquí iría la navegación de Nivel 2 para Uso de Materiales si hubiera múltiples sub-gestores */}
      <div className="gestor-content">
        <GestorDeMateriales />
      </div>
    </div>
  );
}
