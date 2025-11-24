const db = require('../conexion');
const ExcelJS = require('exceljs');
const path = require('path');
const { put, del } = require('@vercel/blob');
const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');


const processGraphicsJob = async (jobId) => {
    let job;
    let filePath; // Definir filePath aquí para que esté disponible en 'finally'

    try {
        // 1. Obtener los detalles del trabajo y actualizar el estado a 'processing'
        const jobResult = await db.query('SELECT * FROM processing_jobs WHERE id = $1', [jobId]);
        if (jobResult.rows.length === 0) {
            throw new Error(`Job con ID ${jobId} no encontrado.`);
        }
        job = jobResult.rows[0];

        filePath = job.payload.filePath; // Asignar filePath desde el payload
        if (!filePath) {
            throw new Error('El payload del job no contiene una ruta de archivo (filePath).');
        }

        await db.query("UPDATE processing_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [jobId]);

        const { project_id: projectId, user_id: userId } = job;

        // 2. El archivo ya está en disco, no se necesita descarga.
        // 3. Procesar el archivo desde la ruta local.
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        console.log(`Workbook cargado desde ${filePath} correctamente.`);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('No se encontró ninguna hoja en el archivo.');
        }

        const startRows = [];
        worksheet.getColumn('B').eachCell((cell, rowNumber) => {
            if (cell.value === 'ESTACIÓN') {
                startRows.push(rowNumber);
            }
        });

        if (startRows.length === 0) {
            throw new Error('No se encontró la palabra clave "ESTACIÓN" en la columna B.');
        }

        const allImages = worksheet.getImages();
        let allFilteredImages = [];

        for (const startRow of startRows) {
            const endRow = startRow + 37;
            const blockImages = allImages.filter(image => {
                if (!image.range || !image.range.tl) return false;
                const imgRange = image.range;
                return imgRange.tl.row >= startRow && imgRange.tl.row <= endRow && imgRange.tl.col >= 0 && imgRange.tl.col <= 14;
            });
            allFilteredImages.push(...blockImages);
        }

        const filteredImages = allFilteredImages;
        filteredImages.sort((a, b) => a.range.tl.row !== b.range.tl.row ? a.range.tl.row - b.range.tl.row : a.range.tl.col - b.range.tl.col);

        // Limpiar registros existentes para este proyecto
 // Usamos la función existente para limpiar

        const extractedImages = [];
        let usefulImageCounter = 1;

        for (const imgData of filteredImages) {
            const img = workbook.getImage(imgData.imageId);
            const { buffer, extension } = img;
            const currentImageIndex = usefulImageCounter;
            const filename = `tramoinv/excelft/${projectId}/${currentImageIndex}.${extension}`;

            const blob = await put(filename, buffer, { 
                access: 'public', 
                allowOverwrite: true,
                token: process.env.BLOB_READ_WRITE_TOKEN 
            });

            await db.query(
                'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url) VALUES ($1, $2, $3)',
                [projectId, String(currentImageIndex), blob.url]
            );

            extractedImages.push({ index: currentImageIndex, url: blob.url });
            usefulImageCounter++;
        }

        // 4. Actualizar el trabajo a 'completed'
        const successResult = { message: `Procesamiento completado. ${extractedImages.length} imágenes extraídas y guardadas.` };
        await db.query("UPDATE processing_jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2", [successResult, jobId]);

        console.log(`Job ${jobId} completado exitosamente.`);

    } catch (error) {
        console.error(`Error procesando el Job ID ${jobId}:`, error);
        // 5. Actualizar el trabajo a 'failed'
        if (jobId) {
            const errorResult = { error: error.message || 'Un error desconocido ocurrió durante el procesamiento.' };
            await db.query("UPDATE processing_jobs SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2", [errorResult, jobId]);
        }
    } finally {
        // Limpiar el archivo temporal después del procesamiento
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Archivo temporal ${filePath} eliminado.`);
        }
    }
};

const deleteGraphicImage = async (imageId, projectId) => {
    try {
        const result = await db.query(
            'SELECT image_url FROM alcantarillas_graficos WHERE id = $1 AND proyecto_id = $2',
            [imageId, projectId]
        );

        if (result.rows.length === 0) {
            throw new Error('Imagen de gráfico no encontrada.');
        }
        const imageUrl = result.rows[0].image_url;

        await del(imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });

        await db.query(
            'DELETE FROM alcantarillas_graficos WHERE id = $1 AND proyecto_id = $2',
            [imageId, projectId]
        );

        return { message: `Imagen de gráfico ${imageId} eliminada correctamente.` };
    } catch (error) {
        console.error('Error en deleteGraphicImage:', error);
        throw new Error('Error al eliminar la imagen de gráfico: ' + error.message);
    }
};

const deleteAllGraphicImages = async (projectId) => {
    try {
        const result = await db.query(
            'SELECT image_url FROM alcantarillas_graficos WHERE proyecto_id = $1',
            [projectId]
        );

        for (const row of result.rows) {
            try {
                await del(row.image_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } catch (delError) {
                console.error(`No se pudo eliminar el blob ${row.image_url}, puede que ya no exista. Continuando...`, delError);
            }
        }

        await db.query(
            'DELETE FROM alcantarillas_graficos WHERE proyecto_id = $1',
            [projectId]
        );

        return { message: `Todas las imágenes de gráfico para el proyecto ${projectId} eliminadas correctamente.` };
    } catch (error) {
        console.error('Error en deleteAllGraphicImages:', error);
        throw new Error('Error al eliminar todas las imágenes de gráfico: ' + error.message);
    }
};

const getGraphicsImagesByProjectId = async (projectId) => {
    try {
        const result = await db.query(
            `SELECT 
                ag.id, 
                ag.image_index as index, 
                ag.image_url as url
             FROM alcantarillas_graficos ag
             WHERE ag.proyecto_id = $1 
             ORDER BY ag.image_index`,
            [projectId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error en getGraphicsImagesByProjectId:', error);
        throw new Error('Error al obtener imágenes de gráficos por ID de proyecto: ' + error.message);
    }
};

const reassembleAndProcessChunks = async (projectId, uploadId, originalFilename, userId) => {
    const chunkDir = path.join('/tmp', uploadId);
    const finalFilePath = path.join('/tmp', originalFilename);

    try {
        const files = await fsp.readdir(chunkDir);
        files.sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));

        const writeStream = fs.createWriteStream(finalFilePath);
        for (const file of files) {
            const chunkPath = path.join(chunkDir, file);
            const chunkBuffer = await fsp.readFile(chunkPath);
            writeStream.write(chunkBuffer);
            await fsp.unlink(chunkPath);
        }
        writeStream.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        await fsp.rmdir(chunkDir);

        const jobPayload = { filePath: finalFilePath, originalName: originalFilename, userId: userId };
        const jobType = path.extname(originalFilename).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload) VALUES ($1, $2, $3, $4) RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        if (jobType === 'rar_extraction') {
            processRarExtractionJob(jobId).catch(err => console.error(`Error no controlado en el job de extracción RAR (Job ID: ${jobId}):`, err));
        } else {
            processSimpleUploadJob(jobId).catch(err => console.error(`Error no controlado en el job de subida simple (Job ID: ${jobId}):`, err));
        }

        return {
            status: 'ok',
            message: 'Archivo ensamblado. El procesamiento ha comenzado en segundo plano.',
            jobId: jobId
        };
    } catch (error) {
        console.error('Error reassembling chunks:', error);
        if (fs.existsSync(chunkDir)) await fsp.rm(chunkDir, { recursive: true, force: true });
        if (fs.existsSync(finalFilePath)) await fsp.unlink(finalFilePath);
        throw new Error('Error al reensamblar el archivo.');
    }
};

const processRarExtractionJob = async (jobId) => {
    let job, rarFilePath;
    const extractionDir = path.join('/tmp', `extract_${uuidv4()}`);

    try {
        const jobResult = await db.query('SELECT * FROM processing_jobs WHERE id = $1', [jobId]);
        if (jobResult.rows.length === 0) throw new Error(`Job con ID ${jobId} no encontrado.`);
        job = jobResult.rows[0];
        rarFilePath = job.payload.filePath;

        await db.query("UPDATE processing_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [jobId]);
        const { project_id: projectId } = job;

        // 1. Create extraction directory
        await fsp.mkdir(extractionDir, { recursive: true });

        // 2. Extract RAR file to disk
        console.log(`Iniciando extracción de ${rarFilePath} a ${extractionDir}`);

        // DEBUG: Check if file exists right before extraction
        if (!fs.existsSync(rarFilePath)) {
            throw new Error(`El archivo RAR de entrada no se encontró en la ruta esperada: ${rarFilePath}`);
        }

        // Using child_process.exec directly for more control
        const command = `unrar e "${rarFilePath}" "${extractionDir}"`;
        console.log(`Executing command: ${command}`);

        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error.message}`);
                    console.error(`stderr: ${stderr}`);
                    // unrar puede escribir en stderr para información no crítica, así que solo rechazamos si hay un error real.
                    return reject(new Error(`Error al ejecutar unrar: ${stderr || error.message}`));
                }
                console.log(`stdout: ${stdout}`);
                if (stderr) {
                    console.warn(`stderr: ${stderr}`);
                }
                resolve();
            });
        });
        console.log('Extracción de archivo RAR completada.');

        // 3. Recursively find all files in the extraction directory
        const getAllFiles = async (dirPath, arrayOfFiles = []) => {
            const files = await fsp.readdir(dirPath);

            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                if ((await fsp.stat(fullPath)).isDirectory()) {
                    await getAllFiles(fullPath, arrayOfFiles);
                } else {
                    arrayOfFiles.push(fullPath);
                }
            }
            return arrayOfFiles;
        };

        const extractedFiles = await getAllFiles(extractionDir);
        console.log(`Encontrados ${extractedFiles.length} archivos en el directorio extraído.`);

        let extractedImageCount = 0;


        // 4. Process each extracted file
        for (const filePath of extractedFiles) {
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filePath);
            if (isImage) {
                extractedImageCount++; // Still count for the final message
                const originalFileName = path.basename(filePath); // Get original filename
                // Construct filename for Vercel Blob using original name
                const filename = `tramoinv/uploaded/${projectId}/${originalFileName}`;

                const fileBuffer = await fsp.readFile(filePath);

                const blob = await put(filename, fileBuffer, {
                    access: 'public',
                    allowOverwrite: true,
                    token: process.env.BLOB_READ_WRITE_TOKEN
                });

                await db.query(
                    'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url) VALUES ($1, $2, $3)',
                    [projectId, originalFileName, blob.url] // Store original filename in image_index
                );
            } else {
                console.log(`Archivo omitido (no es una imagen): ${filePath}`);
            }
        }

        if (extractedImageCount === 0) {
            throw new Error('El archivo RAR no contenía imágenes válidas (jpg, jpeg, png, gif).');
        }

        const successResult = { message: `Procesamiento completado. ${extractedImageCount} imágenes extraídas y guardadas.` };
        await db.query("UPDATE processing_jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2", [successResult, jobId]);

    } catch (error) {
        console.error(`Error procesando el Job de extracción RAR ID ${jobId}:`, error);
        if (jobId) {
            const errorResult = { error: error.message || 'Un error desconocido ocurrió.' };
            await db.query("UPDATE processing_jobs SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2", [errorResult, jobId]);
        }
    } finally {
        // 5. Clean up temporary files and directories
        if (rarFilePath && fs.existsSync(rarFilePath)) await fsp.unlink(rarFilePath);
        if (extractionDir && fs.existsSync(extractionDir)) await fsp.rm(extractionDir, { recursive: true, force: true });
        console.log('Limpieza de archivos temporales completada.');
    }
};

const processSimpleUploadJob = async (jobId) => {
    let job, filePath;
    try {
        const jobResult = await db.query('SELECT * FROM processing_jobs WHERE id = $1', [jobId]);
        if (jobResult.rows.length === 0) throw new Error(`Job con ID ${jobId} no encontrado.`);
        job = jobResult.rows[0];
        filePath = job.payload.filePath;

        await db.query("UPDATE processing_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [jobId]);

        const { project_id: projectId, payload } = job;
        const fileBuffer = await fsp.readFile(filePath);
        const extension = path.extname(payload.originalName).substring(1);

        const maxIndexResult = await db.query('SELECT MAX(image_index::INT) as max_index FROM alcantarillas_graficos WHERE proyecto_id = $1', [projectId]);
        const nextIndex = (maxIndexResult.rows[0].max_index || 0) + 1;

        const filename = `tramoinv/uploaded/${projectId}/${nextIndex}.${extension}`;

        const blob = await put(filename, fileBuffer, {
            access: 'public',
            allowOverwrite: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        await db.query(
            'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url) VALUES ($1, $2, $3)',
            [projectId, String(nextIndex), blob.url]
        );

        const successResult = { message: `Archivo subido y guardado correctamente.` };
        await db.query("UPDATE processing_jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2", [successResult, jobId]);
    } catch (error) {
        console.error(`Error procesando el Job de subida simple ID ${jobId}:`, error);
        if (jobId) {
            const errorResult = { error: error.message || 'Un error desconocido ocurrió.' };
            await db.query("UPDATE processing_jobs SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2", [errorResult, jobId]);
        }
    } finally {
        if (filePath && fs.existsSync(filePath)) await fsp.unlink(filePath);
    }
};


module.exports = {
    processGraphicsJob,
    deleteGraphicImage,
    deleteAllGraphicImages,
    getGraphicsImagesByProjectId,
    reassembleAndProcessChunks,
    processRarExtractionJob,
    processSimpleUploadJob,
};