import React, { useState, useMemo, useEffect, useRef } from 'react';
import './AssayTypeSelector.css';

const AssayTypeSelector = ({ options, selected, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isListVisible, setIsListVisible] = useState(false);
  const selectorRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsListVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    // 1. Get a set of selected values for quick lookup
    const selectedValues = new Set(selected.map(item => item.value));
    
    // 2. Filter out already selected options
    const availableOptions = options.filter(option => !selectedValues.has(option.value));

    // 3. Filter by search term
    if (!searchTerm) {
      return availableOptions;
    }
    return availableOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, selected, searchTerm]);

  const handleToggleSelection = (option) => {
    // This component now only adds items. Removal is handled by the badge 'X' button.
    const isSelected = selected.some(item => item.value === option.value);
    if (!isSelected) {
      onChange([...selected, option]);
    }
    setSearchTerm(''); // Clear search term after selection
    setIsListVisible(false); // Hide list after selection
  };

  const handleRemoveSelected = (itemToRemove) => {
    onChange(selected.filter(item => item.value !== itemToRemove.value));
  };

  return (
    <div className="assay-type-selector-container" ref={selectorRef}>
      {/* Display selected items as badges first */}
      {selected.length > 0 && (
        <div className="selected-assays-display">
          <div className="selected-assays-badges">
            {selected.map(item => (
              <span key={item.value} className="selected-assay-badge">
                {item.label}
                <button
                  type="button"
                  className="remove-assay-button"
                  onClick={() => handleRemoveSelected(item)}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* The input acts as the dropdown toggle */}
      <div className="assay-search-input-wrapper">
        <input
          type="text"
          placeholder="Buscar y agregar tipos de ensayo..."
          className="assay-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsListVisible(true)}
        />
      </div>

      {/* Conditionally render the dropdown list */}
      {isListVisible && (
        <div className="assay-list-container">
          {filteredOptions.length === 0 ? (
            <div className="no-results">No hay más ensayos disponibles.</div>
          ) : (
            <ul className="assay-options-list">
              {filteredOptions.map(option => (
                <li
                  key={option.value}
                  className="assay-option-item"
                  onClick={() => handleToggleSelection(option)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AssayTypeSelector;