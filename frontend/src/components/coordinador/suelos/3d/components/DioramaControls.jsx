import React from 'react';

export default function DioramaControls({
    cameraMode,
    setCameraMode,
    isGroundMode,
    setIsGroundMode,
    onResetDiorama
}) {
    if (cameraMode !== 'diorama') return null;

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-2 flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 px-3 border-r border-slate-800">
                <i className="fa-solid fa-cube text-cyan-400 text-sm"></i>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Diorama 3D</span>
            </div>

            <button
                onClick={() => setIsGroundMode(false)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${!isGroundMode
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
            >
                <i className="fa-solid fa-rotate mr-1.5"></i> Órbita
            </button>

            <button
                onClick={() => setIsGroundMode(true)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${isGroundMode
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
            >
                <i className="fa-solid fa-person-walking mr-1.5"></i> Terrestre
            </button>

            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1"></div>

            <button
                onClick={onResetDiorama}
                className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Salir del modo Diorama"
            >
                <i className="fa-solid fa-xmark mr-1"></i> Salir
            </button>
        </div>
    );
}
