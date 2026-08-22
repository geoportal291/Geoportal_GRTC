# Rutas huérfanas y módulos en pausa

Estado a 2026-08-22, tras la limpieza del frontend (rama `limpieza-frontend`).

Este documento existe porque durante la limpieza aparecieron pantallas que **funcionan pero
nadie puede alcanzar desde la interfaz**. No son código muerto —webpack las compila y se
envían al navegador— pero no hay ningún `<Link>` ni `navigate()` que lleve a ellas. Solo se
llega escribiendo la URL a mano.

Se decidió conservarlas todas. Esta lista sirve para no volver a perderlas de vista.

## Rutas sin enlace en la interfaz

| Ruta | Componente | Qué es |
|---|---|---|
| `/menu` | `components/menu.jsx` | Pantalla "Inicio" con filtros sin conectar a la BD y 3 tarjetas. El login va directo a `/coordinador/dashboardprincipal`, así que nunca se muestra. Es el único consumidor de `components/header.jsx` |
| `/ensayos` | `ensayos/layout.jsx` | **Renderiza una página en blanco.** Son 9 líneas: un `<div class="content-wrapper">` sin contenido. El módulo real de ensayos está en `/coordinador/suelos/ensayos/*` |
| `/ingenieria/disenos-ingenieria` | `ingeneria/DisenosIngenieria.jsx` | Menú de tarjetas de diseños de ingeniería. Funcional, solo falta enlazarlo. El submódulo `/ingenieria/disenos/geometrico` sí está enlazado |
| `/coordinador/ingenieria/trafico/traficov2` | `ingeneria/trafico_v2/` | Rediseño del módulo de tráfico, en pausa. Ver sección siguiente |
| `/geotest` | `trafico/GeoTestPage.jsx` | Banco de pruebas de exportación KML/GeoJSON |
| `/test-map` | `coordinador/testmapa.jsx` | Mapa de prueba con rutas y estaciones reales |
| `/geoite` | `coordinador/pruebas/geoite.jsx` | Mapa interactivo de prueba. Duplica en buena parte `invvial/map/geoite.jsx`, que es el de producción |
| `/eventos/amigo-secreto/gestionar` | `eventos/GestionarParticipantes.jsx` | Gestión de participantes del sorteo |
| `/gestionar-participantes` | `eventos/GestionarParticipantes.jsx` | **Ruta duplicada**: carga exactamente el mismo componente que la anterior |

Consecuencia: `components/header.jsx` y el módulo `ensayos/` siguen en el bundle únicamente
porque `App.js` los importa, no porque alguien los use.

## Módulo `trafico_v2` — rediseño en pausa

Iniciado el 2026-05-06, último avance el 2026-06-15 (4 commits). Convive con `trafico/`,
que es el módulo de producción.

|  | `trafico/` | `trafico_v2/` |
|---|---|---|
| Archivos | 27 | 22 |
| Llamadas a la API | 38 | 8 |
| Enlazado en el navbar | Sí | No |
| Origen de los datos | API real | `getMockTrafficData()` en la vista externa |

**No son dos versiones compitiendo.** `trafico/` es el que usan las personas; `trafico_v2` es
un rediseño que nunca se terminó de conectar ni de exponer.

Para retomarlo, lo pendiente es:

1. Sustituir `getMockTrafficData()` por llamadas reales en `TraficoV2External.jsx:376`.
2. Quitar el import muerto de `getMockTrafficData` en `tabs/ReporteFinalV2.jsx`.
3. Añadir el enlace en `components/coordinador/navbar.jsx` junto al de tráfico.
4. Decidir qué pasa con `trafico/` una vez que v2 cubra sus 38 llamadas a la API.

Mientras tanto, cualquier corrección de comportamiento hay que hacerla en `trafico/`.

## Duplicación que ya no existe

Para evitar que se vuelva a reportar como pendiente:

- **`navbar`** — ya consolidado. `menu.jsx` usa `./coordinador/navbar`; solo queda uno vivo.
- **CSS de `geologia/tabs/`** — los 4 archivos idénticos se eliminaron en la fase 2.
- **`components/header.jsx` vs `coordinador/header.jsx`** — no son copias. Son dos cabeceras
  distintas para dos shells distintos (52 y 112 líneas, contenido diferente).
