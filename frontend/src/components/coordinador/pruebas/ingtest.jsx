import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

// ---------------------- DATA MODEL ----------------------
// Category keys
const CATS = {
  SOIL: "Ensayos de Suelos",
  QUARRY: "Ensayos de Canteras",
  ROCK: "Ensayos de Rocas",
  CONCRETE: "Ensayos para Concretos",
  HYD: "Ensayos para Hidráulica",
  PAVE: "Ensayos para Pavimentos",
  WATER: "Ensayos para Fuentes de Agua",
};

// Master catalog of tests. Each test includes standard execution and delivery times.
const MASTER_TESTS = [
  // --- SOILS ---
  { code: "SU-01", name: "Muestreo de Suelos (ASTM D1452/D420/D2488)", cat: CATS.SOIL, exec_h: 2, delivery_d: 2, active: true },
  { code: "SU-02", name: "Contenido de Humedad (ASTM D2216)", cat: CATS.SOIL, exec_h: 2, delivery_d: 1, active: true },
  { code: "SU-03", name: "Granulometría por Tamizado (ASTM C136/D6913)", cat: CATS.SOIL, exec_h: 4, delivery_d: 2, active: true },
  { code: "SU-04", name: "Granulometría por Hidrómetro (ASTM D422/D7928)", cat: CATS.SOIL, exec_h: 6, delivery_d: 3, active: true },
  { code: "SU-05", name: "Límite Líquido (ASTM D4318 – Método Cazagrande)", cat: CATS.SOIL, exec_h: 2.5, delivery_d: 2, active: true },
  { code: "SU-06", name: "Límite Plástico (ASTM D4318)", cat: CATS.SOIL, exec_h: 2, delivery_d: 2, active: true },
  { code: "SU-07", name: "Índice de Plasticidad (ASTM D4318)", cat: CATS.SOIL, exec_h: 0.5, delivery_d: 2, active: true },
  { code: "SU-08", name: "Peso Específico de Sólidos Gs (ASTM D854)", cat: CATS.SOIL, exec_h: 4, delivery_d: 2, active: true },
  { code: "SU-09", name: "Densidad In Situ – Arena de Ottawa (ASTM D1556)", cat: CATS.SOIL, exec_h: 3, delivery_d: 2, active: true },
  { code: "SU-10", name: "Densidad In Situ – Núcleo Nuclear (ASTM D6938)", cat: CATS.SOIL, exec_h: 1.5, delivery_d: 1, active: true },
  { code: "SU-11", name: "Proctor Estándar (ASTM D698)", cat: CATS.SOIL, exec_h: 6, delivery_d: 2, active: true },
  { code: "SU-12", name: "Proctor Modificado (ASTM D1557)", cat: CATS.SOIL, exec_h: 7, delivery_d: 2, active: true },
  { code: "SU-13", name: "CBR – Índice Soporte California (ASTM D1883)", cat: CATS.SOIL, exec_h: 10, delivery_d: 5, active: true },
  { code: "SU-14", name: "Ensayo de Corte Directo (ASTM D3080)", cat: CATS.SOIL, exec_h: 8, delivery_d: 4, active: true },
  { code: "SU-15", name: "Triaxial No Consolidado No Drenado UU (ASTM D2850)", cat: CATS.SOIL, exec_h: 10, delivery_d: 5, active: true },
  { code: "SU-16", name: "Triaxial Consolidado Drenado CD (ASTM D7181)", cat: CATS.SOIL, exec_h: 18, delivery_d: 10, active: true },
  { code: "SU-17", name: "Triaxial Consolidado No Drenado CU c/presión de poros (ASTM D4767)", cat: CATS.SOIL, exec_h: 16, delivery_d: 8, active: true },
  { code: "SU-18", name: "Consolidación Unidimensional (ASTM D2435)", cat: CATS.SOIL, exec_h: 12, delivery_d: 7, active: true },
  { code: "SU-19", name: "Permeabilidad – Carga Constante/Variable (ASTM D2434/D2435)", cat: CATS.SOIL, exec_h: 10, delivery_d: 7, active: true },
  { code: "SU-20", name: "Clasificación SUCS/HRB (ASTM D2487/AASHTO M145)", cat: CATS.SOIL, exec_h: 1, delivery_d: 1, active: true },
  // --- QUARRIES (AGREGADOS) ---
  { code: "CA-01", name: "Muestreo de Agregados (ASTM D75)", cat: CATS.QUARRY, exec_h: 2, delivery_d: 2, active: true },
  { code: "CA-02", name: "Peso Unitario Suelto y Compactado (ASTM C29)", cat: CATS.QUARRY, exec_h: 2, delivery_d: 2, active: true },
  { code: "CA-03", name: "Absorción y Densidad – Grueso (ASTM C127)", cat: CATS.QUARRY, exec_h: 4, delivery_d: 2, active: true },
  { code: "CA-04", name: "Absorción y Densidad – Fino (ASTM C128)", cat: CATS.QUARRY, exec_h: 4, delivery_d: 2, active: true },
  { code: "CA-05", name: "Equivalente de Arena (ASTM D2419)", cat: CATS.QUARRY, exec_h: 3, delivery_d: 2, active: true },
  { code: "CA-06", name: "Partículas Planas y Alargadas (ASTM D4791)", cat: CATS.QUARRY, exec_h: 3, delivery_d: 2, active: true },
  { code: "CA-07", name: "Resistencia al Desgaste – Los Ángeles (ASTM C131/C535)", cat: CATS.QUARRY, exec_h: 6, delivery_d: 3, active: true },
  { code: "CA-08", name: "Sanidad (Sulfatos) (ASTM C88)", cat: CATS.QUARRY, exec_h: 8, delivery_d: 5, active: true },
  { code: "CA-09", name: "Índice de Lajas (BS 812)", cat: CATS.QUARRY, exec_h: 3, delivery_d: 2, active: true },
  { code: "CA-10", name: "Reactividad Alcalina Sílice (ASTM C1260/C1293)", cat: CATS.QUARRY, exec_h: 12, delivery_d: 14, active: true },
  // --- ROCKS ---
  { code: "RO-01", name: "Densidad y Absorción de Rocas (ASTM C97)", cat: CATS.ROCK, exec_h: 5, delivery_d: 3, active: true },
  { code: "RO-02", name: "Resistencia a Compresión Simple (ASTM D7012)", cat: CATS.ROCK, exec_h: 6, delivery_d: 3, active: true },
  { code: "RO-03", name: "Velocidad de Pulso Ultrasónico (ASTM D2845)", cat: CATS.ROCK, exec_h: 2.5, delivery_d: 2, active: true },
  { code: "RO-04", name: "Índice de Carga Puntual (ISRM)", cat: CATS.ROCK, exec_h: 3, delivery_d: 2, active: true },
  { code: "RO-05", name: "Cohesión y Ángulo de Fricción en Roca (Corte Directo/Triaxial)", cat: CATS.ROCK, exec_h: 10, delivery_d: 6, active: true },
  // --- CONCRETE ---
  { code: "CO-01", name: "Muestreo de Concreto Fresco (ASTM C172)", cat: CATS.CONCRETE, exec_h: 1.5, delivery_d: 1, active: true },
  { code: "CO-02", name: "Asentamiento – Cono de Abrams (ASTM C143)", cat: CATS.CONCRETE, exec_h: 0.5, delivery_d: 1, active: true },
  { code: "CO-03", name: "Contenido de Aire – Método Volumétrico (ASTM C231)", cat: CATS.CONCRETE, exec_h: 0.7, delivery_d: 1, active: true },
  { code: "CO-04", name: "Moldeo de Cilindros/Probetas (ASTM C31)", cat: CATS.CONCRETE, exec_h: 1.5, delivery_d: 1, active: true },
  { code: "CO-05", name: "Resistencia a Compresión a 7/14/28 días (ASTM C39)", cat: CATS.CONCRETE, exec_h: 2, delivery_d: 1, active: true },
  { code: "CO-06", name: "Módulo de Rotura – Flexión (ASTM C78)", cat: CATS.CONCRETE, exec_h: 3, delivery_d: 2, active: true },
  { code: "CO-07", name: "Contenido de Unidades/Lavado de Fino (ASTM C138/C173)", cat: CATS.CONCRETE, exec_h: 1, delivery_d: 1, active: true },
  { code: "CO-08", name: "Permeabilidad RCP (ASTM C1202)", cat: CATS.CONCRETE, exec_h: 6, delivery_d: 4, active: true },
  // --- HYDRAULICS ---
  { code: "HY-01", name: "Granulometría para Filtros/Protecciones Hidráulicas", cat: CATS.HYD, exec_h: 4, delivery_d: 2, active: true },
  { code: "HY-02", name: "Erosión/Resistencia al Arrastre de Materiales", cat: CATS.HYD, exec_h: 8, delivery_d: 5, active: true },
  { code: "HY-03", name: "Permeabilidad en Laboratorio para Diseño de Drenes", cat: CATS.HYD, exec_h: 10, delivery_d: 7, active: true },
  // --- PAVEMENTS ---
  { code: "PA-01", name: "Contenido de Asfalto – Ignición (ASTM D6307)", cat: CATS.PAVE, exec_h: 3, delivery_d: 2, active: true },
  { code: "PA-02", name: "Granulometría de Mezclas Asfálticas (ASTM C136)", cat: CATS.PAVE, exec_h: 3, delivery_d: 2, active: true },
  { code: "PA-03", name: "Densidad Máx. Teórica – Rice (ASTM D2041)", cat: CATS.PAVE, exec_h: 2.5, delivery_d: 2, active: true },
  { code: "PA-04", name: "Densidad y Vacíos – Gyratorio/Marshall (ASTM D6926/D6927)", cat: CATS.PAVE, exec_h: 4, delivery_d: 3, active: true },
  { code: "PA-05", name: "Estabilidad y Flujo – Marshall (ASTM D6927)", cat: CATS.PAVE, exec_h: 5, delivery_d: 3, active: true },
  { code: "PA-06", name: "Módulo Dinámico / I-FIT / ITS (AASHTO T342/T283)", cat: CATS.PAVE, exec_h: 8, delivery_d: 5, active: true },
  // --- WATER SOURCES ---
  { code: "FA-01", name: "pH, CE, TDS, Temperatura (APHA/SM 4500) S", cat: CATS.WATER, exec_h: 1.5, delivery_d: 1, active: true },
  { code: "FA-02", name: "Turbiedad y Color (APHA 2130/2120)", cat: CATS.WATER, exec_h: 1.2, delivery_d: 1, active: true },
  { code: "FA-03", name: "DQO/DBO5 (APHA 5220/5210)", cat: CATS.WATER, exec_h: 6, delivery_d: 4, active: true },
  { code: "FA-04", name: "Coliformes Totales y Fecales (APHA 9222/9223)", cat: CATS.WATER, exec_h: 5, delivery_d: 3, active: true },
  { code: "FA-05", name: "Metales Pesados ICP/OES (EPA 200.7/200.8)", cat: CATS.WATER, exec_h: 10, delivery_d: 5, active: true },
];

// Example KPI time series (weekly)
const kpiSeries = [
  { week: "W-1", throughput: 42, onTime: 0.86, fpY: 0.92 },
  { week: "W-2", throughput: 48, onTime: 0.9, fpY: 0.93 },
  { week: "W-3", throughput: 46, onTime: 0.88, fpY: 0.91 },
  { week: "W-4", throughput: 55, onTime: 0.94, fpY: 0.95 },
  { week: "W-5", throughput: 53, onTime: 0.92, fpY: 0.96 },
  { week: "W-6", throughput: 58, onTime: 0.95, fpY: 0.97 },
];

// ---------------------- HELPERS ----------------------
const useLocalState = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* no-op */
    }
  }, [key, value]);
  return [value, setValue];
};

function groupBy(arr, key) {
  return arr.reduce((acc, it) => {
    const k = typeof key === 'function' ? key(it) : it[key];
    (acc[k] ||= []).push(it);
    return acc;
  }, {});
}

// ---------------------- UI BLOCKS ----------------------
function KPIBadge({ label, value, icon: Icon, suffix }) {
  return (
    <div className="rounded-2xl shadow-md bg-white p-4">
      <div className="pb-2 flex flex-row items-center justify-between">
        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Lean</span>
      </div>
      <div>
        <div className="text-3xl font-semibold">{value}{suffix || ''}</div>
      </div>
    </div>
  );
}

function CatalogTable({ data, allowToggle = false, onToggle }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [sort, setSort] = useState("code");
  const [showInactive] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;
    // Filtrar por categoría
    if (cat !== "ALL") rows = rows.filter(r => r.cat === cat);
    // Filtrar por búsqueda
    if (q) {
      const k = q.toLowerCase();
      rows = rows.filter(r => `${r.code} ${r.name}`.toLowerCase().includes(k));
    }
    // Filtrar por estado activo/inactivo si allowToggle es false
    if (!allowToggle && !showInactive) {
      rows = rows.filter(r => r.active);
    }
    rows = [...rows].sort((a, b) => {
      if (sort === "code") return a.code.localeCompare(b.code);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "exec") return a.exec_h - b.exec_h;
      if (sort === "deliv") return a.delivery_d - b.delivery_d;
      return 0;
    });
    return rows;
  }, [data, q, cat, sort]);

  const groups = groupBy(filtered, 'cat');
  const categories = ["ALL", ...Object.values(CATS)];

  // Calcular estadísticas por categoría
  const categoryStats = useMemo(() => {
    const stats = {};
    Object.keys(groups).forEach(category => {
      const activeCount = groups[category].filter(test => test.active).length;
      const totalCount = groups[category].length;
      stats[category] = { activeCount, totalCount };
    });
    return stats;
  }, [groups]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="Código o nombre de ensayo"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="min-w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            <option value="code">Código</option>
            <option value="name">Nombre</option>
          </select>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Filter className="w-4 h-4" />Filtros
        </button>
      </div>
      {Object.keys(groups).sort().map(gr => (
        <div key={gr} className="rounded-2xl bg-white shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" /> {gr}
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {groups[gr].length} ensayos
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                categoryStats[gr].activeCount > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {categoryStats[gr].activeCount} activos
              </span>
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr className="border-b">
                    <th className="py-2">Activo</th>
                    <th className="py-2">Código</th>
                    <th className="py-2 text-left">Nombre del ensayo</th>
                    <th className="py-2 text-center"></th>
                    <th className="py-2 text-center"></th>
                    <th className="py-2 text-center">{allowToggle ? "" : "Ver Ensayo"}</th>
                    <th className="py-2 text-center">{allowToggle ? "Estadistica" : "Normas"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groups[gr].map((r) => (
                    <tr key={r.code}>
                      <td className="py-2">
                        {allowToggle ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={r.active}
                              onChange={() => onToggle && onToggle(r.code)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              r.active
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {r.active ? "Activo" : "No Activo"}
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            r.active
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {r.active ? "Activo" : "No Activo"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 font-mono">{r.code}</td>
                      <td className="py-2 text-left">{r.name}</td>
                      <td className="py-2">{allowToggle ? "" : ""}</td>
                      <td className="py-2">{allowToggle ? "" : ""}</td>
                      <td className="py-2 text-center">{allowToggle ? "" : (
                        <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </button>)}
                      </td>
                      <td className="py-2 text-center">{allowToggle ? (
                        <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                          <BarChart3 className="h-4 w-4" />
                        </button>) : (
                        <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                          <StickyNote className="h-4 w-4" />
                        </button>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------- ICONS ----------------------
// Definimos los íconos como componentes de React para mantener la consistencia.
// En una aplicación real, podrías importarlos de una biblioteca como react-icons.
const TrendingUp = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
const Search = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const Filter = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const CheckCircle2 = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>;
const Clock = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const Package = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;
const Gauge = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>;
const Settings2 = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>;
const Eye = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const BarChart3 = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const SheetIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>;
const StickyNote = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"></path><path d="M15 3v6h6"></path></svg>;
const Printer = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>;
const FileText = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>;

// ---------------------- MAIN APP ----------------------
export default function App() {
  const [catalog, setCatalog] = useLocalState("leanlab-catalog", MASTER_TESTS);
  const [activeTab, setActiveTab] = useState("kpi");

  // KPIs derived from catalog + hypothetical WIP/flow data
  const totalActive = useMemo(() => catalog.filter(c => c.active).length, [catalog]);
  const avgExec = useMemo(() => (catalog.reduce((a, c) => a + c.exec_h, 0) / catalog.length).toFixed(1), [catalog]);
  const avgDelivery = useMemo(() => (catalog.reduce((a, c) => a + c.delivery_d, 0) / catalog.length).toFixed(1), [catalog]);

  // Lean metrics (toy example values)
  const WIP = 37; // current items in proceso
  const CT = 14.3; // cycle time días
  const TH = 3.9; // throughput ensayos/día
  const Takt = 4.0; // demanda ensayos/día
  const OTIF = 0.93; // On-Time In-Full
  const FPY = 0.95; // First Pass Yield

  const handleToggle = (code) => {
    setCatalog(prev => prev.map(t => t.code === code ? { ...t, active: !t.active } : t));
  };

  // Estados para la pestaña de rates
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("code");

  // Filtrar y ordenar para la tabla de rates
  const filteredRates = useMemo(() => {
    let filtered = catalog;
    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term)
      );
    }
    // Filtrar por categoría
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(item => item.cat === selectedCategory);
    }
    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "code":
          return a.code.localeCompare(b.code);
        case "name":
          return a.name.localeCompare(b.name);
        case "exec":
          return a.exec_h - b.exec_h;
        case "deliv":
          return a.delivery_d - b.delivery_d;
        case "capacity":
          return Math.floor(8 / a.exec_h) - Math.floor(8 / b.exec_h);
        default:
          return 0;
      }
    });
    return filtered;
  }, [catalog, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 p-6">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">LeanLab · Seguimiento de Ensayos</h1>
            <p className="text-sm text-gray-500">Sistema de gestión basado en Lean Construction con KPIs de producción, catálogo completo de ensayos y rendimientos estándar.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Settings2 className="w-4 h-4" /> Configuración
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {/* Tabs List */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full mb-6">
          {[
            { value: "kpi", label: "Producción & KPIs" },
            { value: "catalog", label: "Catálogo de Ensayos" },
            { value: "visibility", label: "Visibilidad" },
            { value: "rates", label: "Rendimientos Estándar" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                activeTab === tab.value
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: KPIs */}
        {activeTab === "kpi" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <KPIBadge label="Ensayos Activos" value={totalActive} icon={TrendingUp} />
              <KPIBadge label="T. Ejecución Promedio" value={avgExec} icon={Clock} suffix=" h" />
              <KPIBadge label="T. Entrega Promedio" value={avgDelivery} icon={Gauge} suffix=" d" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                    <TrendingUp className="w-4 h-4" /> Throughput semanal
                  </h3>
                </div>
                <div className="px-6 py-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="throughput" name="Ensayos/sem" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl bg-white shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                    <CheckCircle2 className="w-4 h-4" /> Puntualidad y FPY
                  </h3>
                </div>
                <div className="px-6 py-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0.7, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                      <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} />
                      <Line type="monotone" dataKey="onTime" name="On-Time" dot={false} stroke="#10b981" />
                      <Line type="monotone" dataKey="fpY" name="First Pass Yield" dot={false} stroke="#8b5cf6" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Tablero Lean</h3>
              </div>
              <div className="px-6 py-4 grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">Demanda vs Capacidad</div>
                  <div className="text-gray-500">Takt ≈ {Takt} ens/día · TH ≈ {TH} ens/día</div>
                </div>
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">WIP & Lead Time</div>
                  <div className="text-gray-500">WIP {WIP} · CT {CT} días</div>
                </div>
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">Calidad</div>
                  <div className="text-gray-500">OTIF {(OTIF * 100).toFixed(0)}% · FPY {(FPY * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG */}
        {activeTab === "catalog" && (
          <CatalogTable data={catalog} />
        )}

        {/* TAB 3: VISIBILITY */}
        {activeTab === "visibility" && (
          <CatalogTable data={catalog} allowToggle onToggle={handleToggle} />
        )}

        {/* TAB 4: RATES */}
        {activeTab === "rates" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Rendimientos Estándar por Ensayo</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {/* Filtros y búsqueda */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          placeholder="Código o nombre de ensayo"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="min-w-[220px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      >
                        <option value="ALL">Todas las categorías</option>
                        {Object.values(CATS).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-[220px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      >
                        <option value="code">Código</option>
                        <option value="name">Nombre</option>
                        <option value="exec">Tiempo Ejecución (h)</option>
                        <option value="deliv">Tiempo Entrega (d)</option>
                        <option value="capacity">Capacidad</option>
                      </select>
                    </div>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("ALL");
                        setSortBy("code");
                      }}
                    >
                      <Filter className="w-4 h-4" />Limpiar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500">
                        <tr className="border-b">
                          <th className="py-2">Código</th>
                          <th className="py-2">Ensayo</th>
                          <th className="py-2">Categoría</th>
                          <th className="py-2 text-center">T. Ejecución (h)</th>
                          <th className="py-2 text-center">T. Entrega (d)</th>
                          <th className="py-2 text-center">Capacidad Est. (ens/día)</th>
                          <th className="py-2 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRates.map((r) => (
                          <tr key={r.code}>
                            <td className="py-2 font-mono">{r.code}</td>
                            <td className="py-2">{r.name}</td>
                            <td className="py-2">{r.cat}</td>
                            <td className="py-2 text-center">{r.exec_h}</td>
                            <td className="py-2 text-center">{r.delivery_d}</td>
                            <td className="py-2 text-center">{Math.max(1, Math.floor(8 / r.exec_h))}</td>
                            <td className="py-2">
                              <div className="flex justify-center gap-2">
                                <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                                  <BarChart3 className="h-4 w-4" />
                                </button>
                                <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-8 w-8">
                                  <Printer className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="max-w-7xl mx-auto mt-8 text-xs text-gray-500">
        © {new Date().getFullYear()} LeanLab. Estándares de referencia: ASTM/AASHTO/APHA/EPA – ajustar a normativa local (MTC/INACAL/NTC/BS/ISRM).
      </footer>
    </div>
  );
}