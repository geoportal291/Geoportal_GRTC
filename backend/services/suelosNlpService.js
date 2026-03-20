const db = require('../conexion');
const axios = require('axios');

// El Worker NLP de Python corre en el MISMO SERVIDOR que Node pero en el puerto 8000 internamente.
// No debe apuntar a la web pública de la app, sino a localhost localmente.
const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://127.0.0.1:8000';

class SuelosNlpService {
    async clasificarSuelo(texto) {
        if (!texto) {
            throw new Error("Texto vacío");
        }

        try {
            // 1. Obtener TODO el diccionario de la memoria de PostgreSQL
            const result = await db.query(`
                SELECT id, nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, es_verificado_por_humano
                FROM public.suelos_diccionario_nlp
            `);
            const diccionario = result.rows;

            if (diccionario.length === 0) {
                return {
                    encontrado: false,
                    error: "La base de datos del diccionario NLP está vacía",
                    color_hex_sugerido: "#FFFFFF"
                };
            }

            // 2. Enviar el diccionario + el texto al Python Worker (FastAPI) a través de red interna
            const response = await axios.post(`${PYTHON_WORKER_URL}/nlp/clasificar-suelo`, {
                texto: texto,
                diccionario: diccionario
            });

            return response.data;

        } catch (error) {
            console.error("Error en SuelosNlpService:", error.message);
            throw new Error("Fallo la comunicación con el motor NLP o la BD");
        }
    }

    async clasificarSuelosBatch(textos) {
        if (!textos || !Array.isArray(textos) || textos.length === 0) {
            return [];
        }

        try {
            // 1. Obtener TODO el diccionario de la memoria de PostgreSQL
            const result = await db.query(`
                SELECT id, nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, es_verificado_por_humano
                FROM public.suelos_diccionario_nlp
            `);
            const diccionario = result.rows;

            if (diccionario.length === 0) {
                return textos.map(t => ({
                    texto: t,
                    resultado: {
                        encontrado: false,
                        error: "La base de datos del diccionario NLP está vacía",
                        color_hex_sugerido: "#FFFFFF"
                    }
                }));
            }

            // Eliminar textos duplicados para optimizar llamadas
            const textosUnicos = [...new Set(textos.filter(t => t))];

            // Realizar las peticiones en paralelo (FastAPI local aguanta sin problema)
            const promesas = textosUnicos.map(async (texto) => {
                try {
                    const response = await axios.post(`${PYTHON_WORKER_URL}/nlp/clasificar-suelo`, {
                        texto: texto,
                        diccionario: diccionario
                    });
                    return { texto, resultado: response.data };
                } catch (err) {
                    return { texto, error: err.message };
                }
            });

            const resultadosUnicos = await Promise.all(promesas);

            // Armar el resultado final (map usando el query original para conservar el orden/array original)
            return textos.map(texto => {
                const encontrado = resultadosUnicos.find(r => r.texto === texto);
                return encontrado || { texto, error: "No se procesó" };
            });

        } catch (error) {
            console.error("Error en clasificarSuelosBatch:", error.message);
            throw new Error("Fallo la comunicación con el motor NLP o la BD en batch");
        }
    }
}

module.exports = new SuelosNlpService();
