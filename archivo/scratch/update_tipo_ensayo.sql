-- =========================================================================================
-- SQL UPDATE PARA CONFIGURACIÓN DE GRANULOMETRÍA (ID: 1) EN GEOPORTAL
-- =========================================================================================
-- IMPORTANTE: Este query está diseñado con el operador '||' de PostgreSQL para realizar una
-- actualización NO destructiva. Esto significa que agregará las nuevas fórmulas de clasificación
-- y coeficientes sin tocar ni alterar ninguno de los cálculos de tamizado existentes.
-- =========================================================================================

-- 1. Agregar/Sincronizar campos de entrada de LL e IP en 'general_fields' de la config_tabla para Granulometría (ID: 1)
UPDATE tipo_ensayo
SET config_tabla = jsonb_set(
    config_tabla,
    '{general_fields}',
    '[
        {"key": "peso_total", "type": "number", "label": "Peso Total (g)"},
        {"key": "peso_fina_tamizada", "type": "number", "label": "Peso de Fracción Fina para Tamizado (g)"},
        {"key": "peso_muestra_lavada", "type": "calculated", "label": "Peso Muestra Lavada (g)"},
        {"key": "peso_fraccion_gruesa", "type": "calculated", "label": "Peso de la Fracción Gruesa (g)"},
        {"key": "peso_fraccion_fina", "type": "calculated", "label": "Peso Fracción Fina (g)"},
        {"key": "coeficiente", "type": "calculated", "label": "Coeficiente"},
        {"key": "limite_liquido", "type": "number", "label": "Límite Líquido (%)"},
        {"key": "indice_plasticidad", "type": "number", "label": "Índice de Plasticidad (%)"},
        {"key": "gradacion", "type": "text", "label": "Gradación"}
    ]'::jsonb
)
WHERE id = 1;

-- 2. Inyectar de manera segura las funciones dinámicas y fórmulas matemáticas en 'config_calculos' para Granulometría (ID: 1)
-- NOTA: Se utiliza 'config_calculos || jsonb_build_object(...) || ...' para conservar intactas las fórmulas previas de tamices.
UPDATE tipo_ensayo
SET config_calculos = config_calculos 
  -- Inyección de las funciones dinámicas escritas en Javascript clásico (compilables con new Function en caliente)
  || jsonb_build_object(
      '_functions.clasificar_sucs', 
      'function(grava, arena, finos, d10, d30, d60, ll, ip) {
          var F = Number(finos) || 0;
          var G = Number(grava) || 0;
          var S = Number(arena) || 0;
          var LL = Number(ll) || 0;
          var IP = Number(ip) || 0;
          var D10 = Number(d10) || 0;
          var D30 = Number(d30) || 0;
          var D60 = Number(d60) || 0;
          var cu = D10 > 0 ? D60 / D10 : 0;
          var cc = (D10 * D60) > 0 ? (D30 * D30) / (D10 * D60) : 0;
          var lineaA = 0.73 * (LL - 20);
          var esArcilloso = IP >= 7 && IP >= lineaA;
          var esLimoso = IP < 4 || IP < lineaA;
          if (F >= 50) {
              if (LL < 50) {
                  if (IP >= 7 && IP >= lineaA) return "CL";
                  if (IP < 4 || IP < lineaA) return "ML";
                  return "CL-ML";
              } else {
                  if (IP >= lineaA) return "CH";
                  return "MH";
              }
          }
          var esGrava = G > S;
          if (esGrava) {
              if (F < 5) {
                  var bienGraduada = cu >= 4 && cc >= 1 && cc <= 3;
                  return bienGraduada ? "GW" : "GP";
              } else if (F > 12) {
                  if (esArcilloso) return "GC";
                  if (esLimoso) return "GM";
                  return "GC-GM";
              } else {
                  var bienGraduada = cu >= 4 && cc >= 1 && cc <= 3;
                  if (esArcilloso) return bienGraduada ? "GW-GC" : "GP-GC";
                  if (esLimoso) return bienGraduada ? "GW-GM" : "GP-GM";
                  return bienGraduada ? "GW-GC" : "GP-GC";
              }
          } else {
              if (F < 5) {
                  var bienGraduada = cu >= 6 && cc >= 1 && cc <= 3;
                  return bienGraduada ? "SW" : "SP";
              } else if (F > 12) {
                  if (esArcilloso) return "SC";
                  if (esLimoso) return "SM";
                  return "SC-SM";
              } else {
                  var bienGraduada = cu >= 6 && cc >= 1 && cc <= 3;
                  if (esArcilloso) return bienGraduada ? "SW-SC" : "SP-SC";
                  if (esLimoso) return bienGraduada ? "SW-SM" : "SP-SM";
                  return bienGraduada ? "SW-SC" : "SP-SC";
              }
          }
      }',
      
      '_functions.clasificar_aashto', 
      'function(pasa10, pasa40, pasa200, ll, ip) {
          var F10 = Number(pasa10) || 0;
          var F40 = Number(pasa40) || 0;
          var F200 = Number(pasa200) || 0;
          var LL = Number(ll) || 0;
          var IP = Number(ip) || 0;
          var grupo = "";
          var ig = 0;
          if (F200 <= 35) {
              if (F10 <= 50 && F40 <= 30 && F200 <= 15 && IP <= 6) {
                  grupo = "A-1-a";
                  ig = 0;
              } else if (F40 <= 50 && F200 <= 25 && IP <= 6) {
                  grupo = "A-1-b";
                  ig = 0;
              } else if (F40 >= 51 && F200 <= 10 && IP <= 0) {
                  grupo = "A-3";
                  ig = 0;
              } else {
                  if (LL <= 40) {
                      if (IP <= 10) {
                          grupo = "A-2-4";
                          ig = 0;
                      } else {
                          grupo = "A-2-6";
                          ig = Math.max(0, Math.round(0.01 * (F200 - 15) * (IP - 10)));
                      }
                  } else {
                      if (IP <= 10) {
                          grupo = "A-2-5";
                          ig = 0;
                      } else {
                          grupo = "A-2-7";
                          ig = Math.max(0, Math.round(0.01 * (F200 - 15) * (IP - 10)));
                      }
                  }
              }
          } else {
              var igTerm1 = (F200 - 35) * (0.2 + 0.005 * (LL - 40));
              var igTerm2 = 0.01 * (F200 - 15) * (IP - 10);
              ig = Math.max(0, Math.round(igTerm1 + igTerm2));
              if (LL <= 40) {
                  if (IP <= 10) {
                      grupo = "A-4";
                  } else {
                      grupo = "A-6";
                  }
              } else {
                  if (IP <= 10) {
                      grupo = "A-5";
                  } else {
                      if (IP <= LL - 30) {
                          grupo = "A-7-5";
                      } else {
                          grupo = "A-7-6";
                      }
                  }
              }
          }
          return grupo + " (" + ig + ")";
      }'
  )
  -- Inyección del mapeo de fórmulas y llamadas matemáticas para clasificaciones en el mismo objeto
  || '{
      "calculated_values.sucs.ll": "= (general_fields.limite_liquido > 0 ? general_fields.limite_liquido : 0)",
      "calculated_values.sucs.ip": "= (general_fields.indice_plasticidad > 0 ? general_fields.indice_plasticidad : 0)",
      "calculated_values.sucs.d10": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 10)",
      "calculated_values.sucs.d30": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 30)",
      "calculated_values.sucs.d50": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 50)",
      "calculated_values.sucs.d60": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 60)",
      "calculated_values.sucs.cu": "= (calculated_values.sucs.d10 > 0 ? calculated_values.sucs.d60 / calculated_values.sucs.d10 : 0)",
      "calculated_values.sucs.cc": "= (calculated_values.sucs.d10 * calculated_values.sucs.d60 > 0 ? (calculated_values.sucs.d30 * calculated_values.sucs.d30) / (calculated_values.sucs.d10 * calculated_values.sucs.d60) : 0)",
      "calculated_values.sucs.pasa_10": "= tables.granulometria.malla_10.pasa",
      "calculated_values.sucs.pasa_40": "= tables.granulometria.malla_40.pasa",
      "calculated_values.sucs.pasa_200": "= tables.granulometria.malla_200.pasa",
      "calculated_values.sucs.porcentaje_grava": "= calculated_values.sucs.grava",
      "calculated_values.sucs.porcentaje_arena": "= calculated_values.sucs.arena",
      "calculated_values.sucs.porcentaje_finos": "= calculated_values.sucs.finos",
      "calculated_values.sucs.clasificacion_sucs": "= clasificar_sucs(calculated_values.sucs.grava, calculated_values.sucs.arena, calculated_values.sucs.finos, calculated_values.sucs.d10, calculated_values.sucs.d30, calculated_values.sucs.d60, calculated_values.sucs.ll, calculated_values.sucs.ip)",
      "calculated_values.aashto.clasificacion_aashto": "= clasificar_aashto(calculated_values.sucs.pasa_10, calculated_values.sucs.pasa_40, calculated_values.sucs.pasa_200, calculated_values.sucs.ll, calculated_values.sucs.ip)"
  }'::jsonb
WHERE id = 1;
