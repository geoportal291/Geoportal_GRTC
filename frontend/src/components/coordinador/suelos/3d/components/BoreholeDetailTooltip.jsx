import React from 'react';

export default function BoreholeDetailTooltip({
    selectedEstrato,
    position,
    onClose
}) {
    if (!selectedEstrato) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: position?.x ? `${position.x}px` : '50%',
                top: position?.y ? `${position.y}px` : '50%',
                transform: 'translate(-50%, -100%)',
                marginTop: '-12px'
            }}
            className="z-50 bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 w-72 shadow-[0_15px_35px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full border border-white/40"
                        style={{ backgroundColor: selectedEstrato.nlp_color_hex || '#3b82f6' }}
                    ></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                        {selectedEstrato.nombre_progresiva || 'Calicata'}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white text-xs transition-colors p-1"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div className="space-y-2 text-[9px]">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Estrato / Capa:</span>
                    <span className="text-cyan-300 font-bold">{selectedEstrato.numero_estrato || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Profundidad:</span>
                    <span className="text-white font-mono font-bold">
                        {selectedEstrato.profundidad_inicial ?? '0.00'} m - {selectedEstrato.profundidad_final ?? '0.00'} m
                    </span>
                </div>

                {selectedEstrato.clasificacion_sucs && (
                    <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Clasif. SUCS:</span>
                        <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-black">
                            {selectedEstrato.clasificacion_sucs}
                        </span>
                    </div>
                )}

                {selectedEstrato.humedad && (
                    <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Humedad Natural:</span>
                        <span className="text-amber-300 font-mono font-bold">{selectedEstrato.humedad}%</span>
                    </div>
                )}

                {selectedEstrato.descripcion && (
                    <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/60 mt-2">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción Litológica:</span>
                        <p className="text-slate-300 text-[8px] italic leading-relaxed">
                            {selectedEstrato.descripcion}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
