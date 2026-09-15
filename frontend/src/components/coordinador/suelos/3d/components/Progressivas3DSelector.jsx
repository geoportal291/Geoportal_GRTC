import React, { useRef } from 'react';

export default function Progressivas3DSelector({
    isOpen,
    modelos = [],
    selectedModelo,
    setSelectedModelo,
    handleDeleteModel,
    handleFileChange
}) {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    return (
        <aside className="absolute left-0 top-0 w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col z-40 shrink-0 shadow-[20px_0_40px_rgba(0,0,0,0.5)] h-full animate-in slide-in-from-left-full duration-500 ease-out">
            <div className="p-4 border-b border-slate-800/50">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xml,.zip,.ifc"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white py-4 rounded-xl transition-all flex flex-col items-center gap-1 group"
                >
                    <i className="fa-solid fa-cloud-arrow-up text-xl group-hover:scale-110 transition-transform"></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Importar LandXML</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="px-2 mb-2">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modelos Disponibles</h4>
                </div>
                {modelos.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <i className="fa-solid fa-folder-open text-slate-700 text-3xl mb-3"></i>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Sin modelos cargados</p>
                    </div>
                ) : (
                    modelos.map(m => (
                        <div
                            key={m.id}
                            onClick={() => setSelectedModelo(m)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedModelo?.id === m.id
                                ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fa-solid fa-cube text-blue-400 text-[10px]"></i>
                                <h4 className="text-[10px] font-bold text-white truncate flex-1 leading-tight">{m.nombre_archivo}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedModelo?.id === m.id ? 'bg-blue-400 text-blue-950' : 'bg-slate-800 text-slate-500'
                                    }`}>OBJ</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (handleDeleteModel) handleDeleteModel(m.id);
                                    }}
                                    className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                                >
                                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
