import React from 'react';

export default function LayersControlPanel({
    isOpen,
    mapOpacity,
    setMapOpacity,
    zExag,
    setZExag,
    showEstratosLayer,
    setShowEstratosLayer,
    cameraMode,
    setCameraMode,
    dioramaSize,
    setDioramaSize,
    selectedProgressiva3D,
    setSelectedProgressiva3D,
    focusOnSelectedProgressiva,
    soilData,
    flyToProgressive,
    corridorClip,
    setCorridorClip
}) {
    if (!isOpen) return null;

    return (
        <aside className="absolute right-0 top-0 w-80 border-l border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col z-40 shrink-0 h-full animate-in slide-in-from-right-full duration-500 ease-out shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-slate-800 bg-slate-950/20">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opciones Visuales</h3>
            </div>
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terreno Natural</label>
                        <span className="text-blue-400 font-mono text-xs font-bold">{Math.round(mapOpacity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={mapOpacity}
                        onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-500 cursor-pointer"
                    />
                </div>

                <div className="p-5 rounded-2xl border bg-cyan-500/5 border-cyan-400/20 shadow-inner shadow-cyan-500/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/15 text-cyan-300">
                                <i className="fa-solid fa-cube text-sm"></i>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-white uppercase tracking-tighter">Modo Diorama</span>
                                <span className="block text-[8px] text-cyan-200/70 font-bold uppercase tracking-widest">
                                    {selectedProgressiva3D ? selectedProgressiva3D.nombre : 'Selecciona una progresiva'}
                                </span>
                            </div>
                        </div>
                        {selectedProgressiva3D && (
                            <button
                                onClick={() => {
                                    setSelectedProgressiva3D(null);
                                    setCameraMode('orbit');
                                }}
                                className="text-[8px] px-2 py-1 rounded-md border border-cyan-400/20 text-cyan-200 hover:bg-cyan-400/10 transition-colors uppercase tracking-widest font-black"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="space-y-4 pt-4 border-t border-cyan-400/10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modo de Cámara</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    {
                                        id: 'orbit',
                                        label: 'Global',
                                        action: () => {
                                            setSelectedProgressiva3D(null);
                                            setCameraMode('orbit');
                                        }
                                    },
                                    {
                                        id: 'diorama',
                                        label: 'Diorama',
                                        action: () => {
                                            setCameraMode('diorama');
                                            if (focusOnSelectedProgressiva) focusOnSelectedProgressiva();
                                        }
                                    }
                                ].map(({ id, label, action }) => {
                                    const isActive = cameraMode === id;
                                    const isDisabled = id === 'diorama' && !selectedProgressiva3D;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                action();
                                            }}
                                            className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${isDisabled
                                                ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                                                : isActive
                                                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.18)]'
                                                    : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ventana Local</label>
                            <span className="bg-cyan-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full">{dioramaSize} m</span>
                        </div>
                        <input
                            type="range"
                            min="300"
                            max="500"
                            step="25"
                            value={dioramaSize}
                            onChange={(e) => setDioramaSize(parseInt(e.target.value, 10))}
                            className="w-full h-1 bg-slate-900 rounded-full appearance-none accent-cyan-400 cursor-pointer"
                        />
                        <p className="text-[9px] text-slate-500 italic leading-relaxed">
                            Al elegir una progresiva, el LandXML se recorta dentro de este chunk para enfocar estratos y superficie local.
                        </p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest pt-1">
                            <i className="fas fa-computer-mouse mr-1 text-cyan-400/70"></i>
                            Arrastrar: orbitar &nbsp;·&nbsp; Rueda: acercar &nbsp;·&nbsp; Ctrl+Arrastrar: inclinar
                        </p>
                    </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all duration-500 ${corridorClip ? 'bg-emerald-500/5 border-emerald-400/20 shadow-inner shadow-emerald-500/5' : 'bg-slate-800/10 border-slate-800'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${corridorClip ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                                <i className="fa-solid fa-scissors text-sm"></i>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-white uppercase tracking-tighter">Diorama del Tramo</span>
                                <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-500">
                                    {corridorClip ? 'Planeta recortado al trazado (+FPS)' : 'Planeta completo'}
                                </span>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer scale-90">
                            <input
                                type="checkbox"
                                checked={corridorClip}
                                onChange={(e) => setCorridorClip(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-700 peer-checked:bg-emerald-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                        </div>
                    </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all duration-500 ${mapOpacity < 0.1 ? 'bg-blue-600/5 border-blue-500/20 shadow-inner' : 'bg-slate-800/10 border-slate-800 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mapOpacity < 0.1 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                                <i className="fa-solid fa-microscope text-sm"></i>
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Capas Geológicas</span>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer scale-90">
                            <input
                                type="checkbox"
                                checked={showEstratosLayer}
                                onChange={(e) => setShowEstratosLayer(e.target.checked)}
                                className="sr-only peer"
                                disabled={mapOpacity > 0.1}
                            />
                            <div className="w-10 h-5 bg-slate-700 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                        </div>
                    </div>
                    {showEstratosLayer && mapOpacity < 0.1 ? (
                        <div className="space-y-6 pt-4 border-t border-blue-500/10 active:animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Vertical Exaggeration</label>
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{zExag}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={zExag}
                                    onChange={(e) => setZExag(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-900 rounded-full appearance-none accent-blue-400 cursor-pointer"
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-[9px] text-slate-600 italic font-medium leading-relaxed">Baja la opacidad al 0% para habilitar el visor de geología.</p>
                    )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-800">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exploración de Calicatas</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {((soilData?.progresivas || []).filter(p => p.estratos && p.estratos.length > 0)).length === 0 ? (
                            <div className="p-10 text-center opacity-40">
                                <i className="fa-solid fa-location-dot text-2xl mb-2"></i>
                                <p className="text-[9px] font-bold uppercase tracking-tighter leading-none">No hay puntos con estratos</p>
                            </div>
                        ) : (
                            soilData.progresivas
                                .filter(p => p.estratos && p.estratos.length > 0)
                                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                .map(p => {
                                    const hasCoords = p.coordenada_este && p.coordenada_norte;
                                    const hasData = p.estratos && p.estratos.length > 0;
                                    const isDisabled = !hasCoords || !hasData;

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => !isDisabled && flyToProgressive && flyToProgressive(p)}
                                            className={`group p-3 rounded-xl border transition-all flex items-center justify-between ${isDisabled
                                                ? 'bg-slate-900/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                                                : selectedProgressiva3D?.id === p.id
                                                    ? 'bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.12)] cursor-pointer'
                                                    : 'bg-slate-800/30 border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/5 cursor-pointer shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDisabled ? 'bg-slate-600' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                    }`}></div>
                                                <span className={`text-[10px] font-bold transition-colors uppercase tracking-tight truncate ${isDisabled ? 'text-slate-500' : 'text-slate-300 group-hover:text-white'
                                                    }`}>{p.nombre}</span>
                                            </div>
                                            {!isDisabled && (
                                                <i className="fa-solid fa-location-crosshairs text-[10px] text-slate-600 group-hover:text-blue-400 transition-colors"></i>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
