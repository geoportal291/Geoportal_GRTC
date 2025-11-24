import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { TrendingUp, Search, Filter, CheckCircle2, Clock, Package, Gauge, Settings2, Eye, BarChart3, SheetIcon, StickyNote, Printer, FileText  } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";


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
// Times are default estimates that you should calibrate for your lab.
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
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* no-op */ } }, [key, value]);
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
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="w-4 h-4" />{label}</CardTitle>
        <Badge className="text-xs" variant="secondary">Lean</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}{suffix || ''}</div>
      </CardContent>
    </Card>
  );
}

function CatalogTable({ data, allowToggle=false, onToggle }) {
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
    
    rows = [...rows].sort((a,b) => {
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
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input className="pl-9" placeholder="Código o nombre de ensayo" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>
        <div className="min-w-[220px]">
          <Label>Categoria</Label>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <Label>Ordenar por</Label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="code">Código</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="flex items-center gap-2" variant="secondary"><Filter className="w-4 h-4"/>Filtros</Button>
      </div>

      {Object.keys(groups).sort().map(gr => (
        <Card key={gr} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-4 h-4"/> {gr} 
              <Badge variant="outline">{groups[gr].length} ensayos</Badge>
              <Badge variant={categoryStats[gr].activeCount > 0 ? "default" : "secondary"}>
                {categoryStats[gr].activeCount} activos
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
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
                <tbody>
                  {groups[gr].map((r) => (
                    <tr key={r.code} className="border-b last:border-0">
                      <td className="py-2">
                        {allowToggle ? (
                          <div className="flex items-center gap-2">
                            <Switch checked={r.active} onCheckedChange={() => onToggle && onToggle(r.code)} />
                            <Badge variant={r.active?"default":"secondary"}>{r.active?"Activo":"No Activo"}</Badge>
                          </div>
                        ) : (
                          <Badge variant={r.active?"default":"secondary"}>{r.active?"Activo":"No Activo"}</Badge>
                        )}
                      </td>
                      <td className="py-2 font-mono">{r.code}</td>
                      <td className="py-2 text-left">{r.name}</td>
                      <td className="py-2">{allowToggle ? "" : ""}</td>
                      <td className="py-2">{allowToggle ? "" : ""}</td>
                      <td className="py-2 text-center">{allowToggle ? "": (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>)}
                      </td>
                      <td className="py-2 text-center">{allowToggle ? (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <BarChart3 className="h-4 w-4" />
                        </Button>): (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <StickyNote className="h-4 w-4" />
                        </Button>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------- MAIN APP ----------------------
export default function App() {
  const [catalog, setCatalog] = useLocalState("leanlab-catalog", MASTER_TESTS);

  // KPIs derived from catalog + hypothetical WIP/flow data
  const totalActive = useMemo(() => catalog.filter(c=>c.active).length, [catalog]);
  const avgExec = useMemo(() => (catalog.reduce((a,c)=>a+c.exec_h,0)/catalog.length).toFixed(1), [catalog]);
  const avgDelivery = useMemo(() => (catalog.reduce((a,c)=>a+c.delivery_d,0)/catalog.length).toFixed(1), [catalog]);

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
            <p className="text-sm text-muted-foreground">Sistema de gestión basado en Lean Construction con KPIs de producción, catálogo completo de ensayos y rendimientos estándar.</p>
          </div>
          <Button variant="outline" className="gap-2"><Settings2 className="w-4 h-4"/> Configuración</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <Tabs defaultValue="kpi" className="space-y-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
            <TabsTrigger value="kpi">Producción & KPIs</TabsTrigger>
            <TabsTrigger value="catalog">Catálogo de Ensayos</TabsTrigger>
            <TabsTrigger value="visibility">Visibilidad </TabsTrigger>
            <TabsTrigger value="rates">Rendimientos Estándar</TabsTrigger>
          </TabsList>

          {/* TAB 1: KPIs */}
          <TabsContent value="kpi" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <KPIBadge label="Ensayos Activos" value={totalActive} icon={TrendingUp} />
              <KPIBadge label="T. Ejecución Promedio" value={avgExec} icon={Clock} suffix=" h" />
              <KPIBadge label="T. Entrega Promedio" value={avgDelivery} icon={Gauge} suffix=" d" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Throughput semanal</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="throughput" name="Ensayos/sem" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Puntualidad y FPY</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0.7, 1]} tickFormatter={(v)=>`${Math.round(v*100)}%`} />
                      <Tooltip formatter={(v)=>`${Math.round(v*100)}%`} />
                      <Line type="monotone" dataKey="onTime" name="On-Time" dot={false} />
                      <Line type="monotone" dataKey="fpY" name="First Pass Yield" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Tablero Lean</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">Demanda vs Capacidad</div>
                  <div className="text-muted-foreground">Takt ≈ {Takt} ens/día · TH ≈ {TH} ens/día</div>
                </div>
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">WIP & Lead Time</div>
                  <div className="text-muted-foreground">WIP {WIP} · CT {CT} días</div>
                </div>
                <div className="p-4 rounded-xl border bg-white/60">
                  <div className="font-semibold">Calidad</div>
                  <div className="text-muted-foreground">OTIF {(OTIF*100).toFixed(0)}% · FPY {(FPY*100).toFixed(0)}%</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CATALOG */}
          <TabsContent value="catalog">
            <CatalogTable data={catalog} />
          </TabsContent>

          {/* TAB 3: VISIBILITY */}
          <TabsContent value="visibility">
            <CatalogTable data={catalog} allowToggle onToggle={handleToggle} />
          </TabsContent>

          {/* TAB 4: RATES */}
          <TabsContent value="rates" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Rendimientos Estándar por Ensayo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtros y búsqueda */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <Label>Buscar</Label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input 
                          className="pl-9" 
                          placeholder="Código o nombre de ensayo" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="min-w-[220px]">
                      <Label>Categoría</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas las categorías</SelectItem>
                          {Object.values(CATS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[220px]">
                      <Label>Ordenar por</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger><SelectValue placeholder="Código" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code">Código</SelectItem>
                          <SelectItem value="name">Nombre</SelectItem>
                          <SelectItem value="exec">Tiempo Ejecución (h)</SelectItem>
                          <SelectItem value="deliv">Tiempo Entrega (d)</SelectItem>
                          <SelectItem value="capacity">Capacidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="flex items-center gap-2" 
                      variant="secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("ALL");
                        setSortBy("code");
                      }}
                    >
                      <Filter className="w-4 h-4"/>Limpiar
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left">
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
                      <tbody>
                        {filteredRates.map((r) => (
                          <tr key={r.code} className="border-b last:border-0">
                            <td className="py-2 font-mono">{r.code}</td>
                            <td className="py-2">{r.name}</td>
                            <td className="py-2">{r.cat}</td>
                            <td className="py-2 text-center">{r.exec_h}</td>
                            <td className="py-2 text-center">{r.delivery_d}</td>
                            <td className="py-2 text-center">{Math.max(1, Math.floor(8 / r.exec_h))}</td>
                            <td className="py-2">
                              <div className="flex justify-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} LeanLab. Estándares de referencia: ASTM/AASHTO/APHA/EPA – ajustar a normativa local (MTC/INACAL/NTC/BS/ISRM).
      </footer>
    </div>
  );
}
