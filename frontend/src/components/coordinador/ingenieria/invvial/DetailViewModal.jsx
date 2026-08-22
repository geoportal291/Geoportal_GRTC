import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import GeneralDetailView from './obras/GeneralDetailView';
import axiosInstance from '@/api/axios';

/**
 * Modal independiente para mostrar vista detallada de elementos desde el mapa externo
 * Actúa como controlador para fetching de imágenes y delegación a GeneralDetailView
 */
const DetailViewModal = ({ show, onClose, elementData, elementType, projectId, vialHeaderOption, route, graphicsImages, canComment }) => {

    // --- FILTER IMAGES LOGIC (Matches Alcantarillas/Geoite/ExternalView) ---
    const elementImages = React.useMemo(() => {
        if (!show || !elementData) return [];

        // If specific images are already attached, use them (fallback)
        if (elementData.images && elementData.images.length > 0) return elementData.images;

        let code = elementData.panel_fotografico_codigo || elementData.panel_fotografico || elementData.cod_panel;

        // Fallback: If no panel code, try matching by the Element Code (e.g. "KM 25+000")
        if (!code && elementData.codigo) {
            code = elementData.codigo;
        }

        if (!graphicsImages || !code) return [];

        const targetCode = String(code).trim();
        const targetCodeClean = targetCode.replace(/^KM\s*/i, '').trim();

        // 1. Try parsing Range Pattern: "538-543 - 1" -> Start: 538, End: 543, Suffix: 1
        const rangeMatch = targetCode.match(/^(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
        let validRangeCodes = [];

        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            const suffix = rangeMatch[3];

            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    validRangeCodes.push(`${i}-${suffix}`);
                }
            }
        }

        // 2. Aggressive numeric extraction (Fallback)
        const numberMatch = targetCode.match(/(\d+)/);
        const firstNumber = numberMatch ? numberMatch[0] : null;

        const elEntregableRaw = elementData.entregable ? String(elementData.entregable).trim() : 'E-1';

        // Filter global images
        return graphicsImages.filter(img => {
            const imgCode = String(img.panel_fotografico_codigo || '').trim();
            const imgIndex = img.index ? String(img.index).trim() : '';
            const imgEntregableRaw = img.entregable ? String(img.entregable).trim() : 'E-1';

            // Extract filename from URL
            let urlFileName = '';
            if (img.url) {
                const parts = img.url.split('/');
                const fileNameWithExt = parts[parts.length - 1];
                urlFileName = fileNameWithExt.split('.')[0];
            }

            // Logic 1: Range Match
            if (validRangeCodes.length > 0) {
                const isRangeMatch = validRangeCodes.includes(imgIndex) ||
                    validRangeCodes.includes(imgCode) ||
                    validRangeCodes.includes(urlFileName);

                if (isRangeMatch) {
                    return elEntregableRaw === imgEntregableRaw;
                }
            }

            // Standard Match Logic (Fallback if Range is empty)
            if (validRangeCodes.length === 0) {
                const strictMatch = imgCode === targetCode || imgIndex === targetCode || urlFileName === targetCode;
                const cleanMatch = targetCodeClean && (imgCode === targetCodeClean || imgIndex === targetCodeClean || urlFileName === targetCodeClean);
                const numberMetricMatch = firstNumber && (imgIndex === firstNumber || urlFileName === firstNumber);

                const codeMatches = strictMatch || cleanMatch || numberMetricMatch;

                return codeMatches && (elEntregableRaw === imgEntregableRaw);
            }

            return false;
        });
    }, [show, elementData, graphicsImages]);

    if (!show) {
        return null;
    }

    if (!elementData) {
        return null;
    }

    return ReactDOM.createPortal(
        <GeneralDetailView
            data={elementData}
            elementType={elementType}
            images={elementImages}
            route={route}
            onClose={onClose}
            projectId={projectId}
            canComment={canComment}
        />,
        document.body
    );
};

export default DetailViewModal;
