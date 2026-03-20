import React, { useState } from 'react';

export default function BuscadorSuelosBeta() {
    const [texto, setTexto] = useState('');
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const clasificarSuelo = async () => {
        if (!texto.trim()) return;
        setCargando(true);
        setError('');
        setResultado(null);

        try {
            const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';
            const userToken = JSON.parse(localStorage.getItem('user'))?.token;

            const res = await fetch(`${API_BASE}/api/clasificar-suelo-nlp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ texto: texto })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error del servidor Python');

            setResultado(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-slate-200 font-sans flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <i className="fa-solid fa-brain text-purple-400 text-3xl"></i>
                    <div>
                        <h2 className="text-xl font-bold text-white">Motor NLP Beta</h2>
                        <p className="text-xs text-slate-400">Normalizador Inteligente de Estratos</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        Simular texto importado de Excel
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                            placeholder='Ej: "arcila con mucha piedra"'
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && clasificarSuelo()}
                        />
                        <button
                            onClick={clasificarSuelo}
                            disabled={cargando}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50"
                        >
                            {cargando ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Analizar'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/40 border border-red-500/50 text-red-400 px-3 py-2 rounded text-sm mb-4">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
                    </div>
                )}

                {resultado && (
                    <div className={`p-4 rounded-lg border flex flex-col gap-3 ${resultado.confianza < 50 ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-900/50 border-emerald-500/30'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-semibold uppercase">Clasificación SUCS Sugerida</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${resultado.confianza < 50 ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'}`}>
                                {resultado.confianza}% Exactitud
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full border-2 shadow-inner"
                                style={{ backgroundColor: resultado.color_hex_sugerido, borderColor: 'rgba(255,255,255,0.2)' }}
                            ></div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: resultado.color_hex_sugerido }}>
                                    {resultado.clasificacion_sucs_objetivo}
                                </h3>
                                <p className="text-[10px] text-slate-500">
                                    Identificado a partir de regla: <span className="font-mono text-slate-300">"{resultado.match_original}"</span>
                                </p>
                            </div>
                        </div>

                        {resultado.advertencia && (
                            <p className="text-xs text-red-400 mt-2 font-medium">
                                <i className="fa-solid fa-circle-xmark mr-1"></i> {resultado.advertencia}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
