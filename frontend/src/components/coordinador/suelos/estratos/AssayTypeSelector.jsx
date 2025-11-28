import React, { useState, useMemo } from 'react';
import './AssayTypeSelector.css'; // Will create this later if needed for styling

const AssayTypeSelector = ({ options, selected, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleToggleSelection = (option) => {
    const isSelected = selected.some(item => item.value === option.value);
    if (isSelected) {
      onChange(selected.filter(item => item.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleRemoveSelected = (itemToRemove) => {
    onChange(selected.filter(item => item.value !== itemToRemove.value));
  };

  return (
    <div className="assay-type-selector-container">
      <input
        type="text"
        placeholder="Buscar tipos de ensayo..."
        className="assay-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="assay-list-container">
        {filteredOptions.length === 0 ? (
          <p className="no-results">No se encontraron resultados.</p>
        ) : (
          <ul className="assay-options-list">
            {filteredOptions.map(option => (
              <li
                key={option.value}
                className={`assay-option-item ${selected.some(item => item.value === option.value) ? 'selected' : ''}`}
                onClick={() => handleToggleSelection(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="selected-assays-display">
          <h4>Ensayos Seleccionados:</h4>
          <div className="selected-assays-badges">
            {selected.map(item => (
              <span key={item.value} className="selected-assay-badge">
                {item.label}
                <button
                  className="remove-assay-button"
                  onClick={() => handleRemoveSelected(item)}
                >
                  X
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssayTypeSelector;