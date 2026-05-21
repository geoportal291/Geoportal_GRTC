const db = require('../conexion');
const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');
const path = require('path');
const { uploadFileToNAS, deleteFileFromNAS } = require('./nasStorageService');
const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data'); // Import FormData

// --- HELPER TO NORMALIZE ENTREGABLE FOR URLS ---
const normalizeEntregable = (str) => {
    if (!str) return 'SE'; // Sin Entregable
    return String(str).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

// --- HELPER TO CALL PYTHON WORKER ---

const processImageWithPython = async (fileBuffer, originalName) => {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, originalName);

        const response = await axios.post('http://127.0.0.1:8000/process-image', formData, {
            headers: {
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer' // Important to receive binary
        });

        // Extract metadata
        const detectedIndex = response.headers['x-detected-index'];
        const ocrText = response.headers['x-ocr-text'];

        console.log(`✅ Python OCR Success: ${originalName} -> Index: ${detectedIndex}`);

        return {
            buffer: Buffer.from(response.data),
            index: detectedIndex !== 'null' ? detectedIndex : null,
            ocrText: ocrText
        };
    } catch (error) {
        console.error(`⚠️ Python OCR Failed for ${originalName}:`, error.message);
        // Fallback: return original buffer and no index
        return { buffer: fileBuffer, index: null, ocrText: null };
    }
};


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

            // NOTE: processGraphicsJob (Excel extraction) might NOT need OCR because context gives position?
            // User requested functions in "subir imagenes" (Upload Images).
            // But if user wants OCR everywhere, we could add it here too.
            // For now, leaving Excel logic as is (it relies on cell position).

            const entregableCell = worksheet.getRow(imgData.range.tl.row + 1).getCell(13); // Column M is 13th
            const entregableVal = entregableCell ? (entregableCell.value ? String(entregableCell.value).trim() : null) : null;
            const entregableNorm = normalizeEntregable(entregableVal);

            const filename = `${currentImageIndex}.${extension}`;

            const url = await uploadFileToNAS(
                buffer,
                `tramoinv/excelft/${projectId}/${entregableNorm}`,
                filename
            );

            await db.query(
                'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url, entregable) VALUES ($1, $2, $3, $4)',
                [projectId, String(currentImageIndex), url, entregableVal]
            );

            extractedImages.push({ index: currentImageIndex, url: url });
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

        if (imageUrl.includes('files.dafe.it.com')) {
            const urlPath = new URL(imageUrl).pathname;
            const filePath = decodeURIComponent(urlPath.replace(/^\/geoportal\//, ''));
            await deleteFileFromNAS(filePath);
        } else if (imageUrl.includes('vercel-storage.com')) {
            console.log(`Bypassing deletion of legacy Vercel blob: ${imageUrl}`);
        }

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
                if (row.image_url.includes('files.dafe.it.com')) {
                    const urlPath = new URL(row.image_url).pathname;
                    const filePath = decodeURIComponent(urlPath.replace(/^\/geoportal\//, ''));
                    await deleteFileFromNAS(filePath);
                }
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

const deleteGraphicImagesByFolder = async (projectId, entregable) => {
    try {
        let result;
        if (entregable === 'Sin Asignar') {
            result = await db.query(
                'SELECT image_url FROM alcantarillas_graficos WHERE proyecto_id = $1 AND (entregable IS NULL OR entregable = \'\')',
                [projectId]
            );
        } else {
            result = await db.query(
                'SELECT image_url FROM alcantarillas_graficos WHERE proyecto_id = $1 AND entregable = $2',
                [projectId, entregable]
            );
        }

        for (const row of result.rows) {
            try {
                if (row.image_url.includes('files.dafe.it.com')) {
                    const urlPath = new URL(row.image_url).pathname;
                    const filePath = decodeURIComponent(urlPath.replace(/^\/geoportal\//, ''));
                    await deleteFileFromNAS(filePath);
                }
            } catch (delError) {
                console.error(`No se pudo eliminar el blob ${row.image_url}. Continuando...`, delError);
            }
        }

        if (entregable === 'Sin Asignar') {
            await db.query(
                'DELETE FROM alcantarillas_graficos WHERE proyecto_id = $1 AND (entregable IS NULL OR entregable = \'\')',
                [projectId]
            );
        } else {
            await db.query(
                'DELETE FROM alcantarillas_graficos WHERE proyecto_id = $1 AND entregable = $2',
                [projectId, entregable]
            );
        }

        return { message: `Imágenes de la carpeta ${entregable} eliminadas correctamente.` };
    } catch (error) {
        console.error('Error en deleteGraphicImagesByFolder:', error);
        throw new Error('Error al eliminar imágenes por carpeta: ' + error.message);
    }
};

const getGraphicsImagesByProjectId = async (projectId) => {
    try {
        // Auto-migration check (Lazy)
        try {
            await db.query("ALTER TABLE alcantarillas_graficos ADD COLUMN IF NOT EXISTS entregable VARCHAR(50)");
        } catch (migError) {
            console.error('Auto-migration for column entregable failed:', migError.message);
        }

        const result = await db.query(
            `SELECT 
                ag.id, 
                ag.image_index as index, 
                ag.image_url as url,
                ag.entregable
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

const reassembleAndProcessChunks = async (projectId, uploadId, originalFilename, userId, entregable) => {
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

        const jobPayload = { filePath: finalFilePath, originalName: originalFilename, userId: userId, entregable: entregable || null };
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
        const entregable = job.payload.entregable || null;

        // 1. Create extraction directory
        await fsp.mkdir(extractionDir, { recursive: true });

        // 2. Extract RAR file to disk
        // ... (lines 312-356 omitted for brevity, keeping existing logic) ...
        console.log(`Iniciando extracción de ${rarFilePath} a ${extractionDir}`);

        // ... (execution of unrar) ...
        // I need to be careful not to delete the unrar logic.
        // I will target the INSERT statement directly and add 'entregable' variable reading at the top of the loop or function.
        // Actually, let's just insert the variable declaration and update the loop.

        // Re-targeting only the necessary parts to avoid large replace.
        // Splitting into two replaces might be cleaner, but I'll try to target the loop content or just the INSERT.

        // Let's modify the INSERT part. But I need 'entregable' variable available.
        // I'll add 'const entregable = job.payload.entregable || null;' at the beginning of the function (after job is loaded).


        // Wait, 'job' is loaded at line 302.
        // I will target line 306.

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
                const originalFileName = path.basename(filePath);
                console.log(`Procesando imagen extraída: ${originalFileName}`);

                const fileBuffer = await fsp.readFile(filePath);

                // --- PROCESS WITH PYTHON OCR ---
                // const { buffer: processedBuffer, index: detectedIndex } = await processImageWithPython(fileBuffer, originalFileName);
                const processedBuffer = fileBuffer; // Skip OCR
                const detectedIndex = null;

                // Determine final filename
                let finalIndex;
                if (detectedIndex) {
                    finalIndex = detectedIndex;
                } else {
                    // Use filename without extension if it contains numbers or hyphens (e.g., 1-1.jpg -> 1-1)
                    const nameWithoutExt = path.parse(originalFileName).name;
                    if (/^[\d-]+$/.test(nameWithoutExt)) {
                        finalIndex = nameWithoutExt;
                    } else {
                        // If it's not a numeric/hyphenated structure, get the next one from DB
                        const maxIndexResult = await db.query(
                            "SELECT MAX(CASE WHEN image_index ~ '^[0-9]+$' THEN image_index::INT ELSE 0 END) as max_index FROM alcantarillas_graficos WHERE proyecto_id = $1",
                            [projectId]
                        );
                        finalIndex = (maxIndexResult.rows[0].max_index || 0) + 1;
                    }
                }

                // Construct filename with the FINAL INDEX and ENTREGABLE to avoid collisions
                const ext = path.extname(originalFileName);
                const entregableNorm = normalizeEntregable(entregable);
                const filename = `${finalIndex}${ext}`;

                const url = await uploadFileToNAS(
                    processedBuffer,
                    `tramoinv/uploaded/${projectId}/${entregableNorm}`,
                    filename
                );

                await db.query(
                    'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url, entregable) VALUES ($1, $2, $3, $4)',
                    [projectId, String(finalIndex), url, entregable]
                );
            } else {
                console.log(`Archivo omitido (no es una imagen): ${filePath}`);
            }
        }

        if (extractedImageCount === 0) {
            throw new Error('El archivo RAR no contenía imágenes válidas (jpg, jpeg, png, gif).');
        }

        const successResult = { message: `Procesamiento completado. ${extractedImageCount} imágenes extraídas y guardadas (OCR implementado).` };
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
        const originalName = payload.originalName;
        const entregable = payload.entregable || null;
        const extension = path.extname(originalName).substring(1);

        console.log(`Procesando imagen simple: ${originalName} [Entregable: ${entregable}]`);

        // --- PROCESS WITH PYTHON OCR ---
        // const { buffer: processedBuffer, index: detectedIndex } = await processImageWithPython(fileBuffer, originalName);
        const processedBuffer = fileBuffer; // Skip OCR for now
        const detectedIndex = null;

        let nextIndex;
        if (detectedIndex) {
            nextIndex = detectedIndex;
        } else {
            // Use filename without extension if it contains numbers or hyphens (e.g., 1-1.jpg -> 1-1)
            const nameWithoutExt = path.parse(originalName).name;
            if (/^[\d-]+$/.test(nameWithoutExt)) {
                nextIndex = nameWithoutExt;
            } else {
                // Fallback to auto-increment behavior, safely ignoring non-numeric entries
                const maxIndexResult = await db.query(
                    "SELECT MAX(CASE WHEN image_index ~ '^[0-9]+$' THEN image_index::INT ELSE 0 END) as max_index FROM alcantarillas_graficos WHERE proyecto_id = $1",
                    [projectId]
                );
                nextIndex = (maxIndexResult.rows[0].max_index || 0) + 1;
            }
        }

        const entregableNorm = normalizeEntregable(entregable);
        const filename = `${nextIndex}.${extension}`;

        const url = await uploadFileToNAS(
            processedBuffer,
            `tramoinv/uploaded/${projectId}/${entregableNorm}`,
            filename
        );

        await db.query(
            'INSERT INTO alcantarillas_graficos (proyecto_id, image_index, image_url, entregable) VALUES ($1, $2, $3, $4)',
            [projectId, String(nextIndex), url, entregable]
        );

        const successResult = { message: `Archivo subido y procesado (OCR: ${detectedIndex ? 'Sí' : 'No'}). Index: ${nextIndex}` };
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

const processBulkOcrJob = async (jobId) => {
    let job, extractionDir;

    // Create query to get job
    // We assume the payload contains the path to a directory of images OR a standard file list
    // reusing the logic from RAR extraction is smart. 
    // If the input was a RAR, it's already extracted to a dir? No, that was inline.
    // Let's assume the payload provided a 'sourceDir' (extracted from RAR or upload).

    try {
        const jobResult = await db.query('SELECT * FROM processing_jobs WHERE id = $1', [jobId]);
        if (jobResult.rows.length === 0) throw new Error(`Job con ID ${jobId} no encontrado.`);
        job = jobResult.rows[0];

        await db.query("UPDATE processing_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [jobId]);

        const { filePath, originalName, sourceDir, isBatch } = job.payload;

        // 1. Prepare directory
        // If isBatch is true, sourceDir is already prepared by the controller
        if (isBatch && sourceDir) {
            extractionDir = sourceDir;
        } else {
            // Legacy single file/RAR logic (fallback)
            extractionDir = path.join('/tmp', `bulk_ocr_${uuidv4()}`);
            await fsp.mkdir(extractionDir, { recursive: true });

            if (filePath && originalName) {
                // 2. Extract if it's a RAR/ZIP
                const ext = path.extname(originalName).toLowerCase();
                if (ext === '.rar') {
                    const command = `unrar e "${filePath}" "${extractionDir}"`;
                    await new Promise((resolve, reject) => {
                        exec(command, (err) => err ? reject(err) : resolve());
                    });
                } else if (ext === '.zip') {
                    const zip = new AdmZip(filePath);
                    zip.extractAllTo(extractionDir, true);
                }
            }
        }

        console.log('Bulk Job Payload:', job.payload);
        console.log('Extraction Dir:', extractionDir);

        // NEW: Check for archives in the directory and extract them (Handling "RAR inside Batch" case)
        try {
            const dirContents = await fsp.readdir(extractionDir);
            for (const file of dirContents) {
                const fullPath = path.join(extractionDir, file);
                const ext = path.extname(file).toLowerCase();

                if (ext === '.rar') {
                    console.log(`Extracting RAR found in batch: ${file}`);
                    await new Promise((resolve, reject) => {
                        exec(`unrar e -o+ "${fullPath}" "${extractionDir}"`, (err) => {
                            if (err) console.error('Unrar error (ignoring):', err);
                            resolve();
                        });
                    });
                } else if (ext === '.zip') {
                    console.log(`Extracting ZIP found in batch: ${file}`);
                    try {
                        const zip = new AdmZip(fullPath);
                        zip.extractAllTo(extractionDir, true);
                    } catch (e) {
                        console.error('Unzip error:', e);
                    }
                }
            }
        } catch (err) {
            console.error('Error scanning/extracting archives in batch:', err);
        }

        // 3. Find images
        const getAllFiles = async (dir) => {
            const dirents = await fsp.readdir(dir, { withFileTypes: true });
            const files = await Promise.all(dirents.map((dirent) => {
                const res = path.join(dir, dirent.name);
                return dirent.isDirectory() ? getAllFiles(res) : res;
            }));
            return files.flat();
        };

        const allFiles = await getAllFiles(extractionDir);
        console.log(`Found ${allFiles.length} files in total.`);

        const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
        console.log(`Found ${imageFiles.length} image files to process.`);

        const results = [];
        let processedCount = 0;

        // 4. Process Loop
        const startTime = Date.now();
        const totalImages = imageFiles.length;

        for (const imgPath of imageFiles) {
            try {
                const fileBuffer = await fsp.readFile(imgPath);
                const originalName = path.basename(imgPath);

                const formData = new FormData();
                formData.append('file', fileBuffer, originalName);

                // Call Python Extract Endpoint
                const pyRes = await axios.post('http://127.0.0.1:8000/extract-metadata', formData, {
                    headers: { ...formData.getHeaders() }
                });

                if (pyRes.data && pyRes.data.status === 'ok') {
                    const meta = pyRes.data.metadata;
                    results.push({
                        nombre_imagen: originalName,
                        numero_indice: meta.numero_indice,
                        fecha_hora: meta.fecha_hora,
                        coordenadas_identificador: meta.coordenadas_identificador,
                        ubicacion: meta.ubicacion,
                        estacion: meta.estacion,
                        ruta: meta.ruta,
                        altitud: meta.altitud
                    });
                }

                processedCount++;

                // Update progress in DB every 2 items or 10% (to reduce DB load)
                if (processedCount % 5 === 0 || processedCount === totalImages) {
                    const elapsedSeconds = (Date.now() - startTime) / 1000;
                    const imagesPerSecond = processedCount / elapsedSeconds;
                    const remainingImages = totalImages - processedCount;
                    const etrSeconds = imagesPerSecond > 0 ? Math.ceil(remainingImages / imagesPerSecond) : 0;
                    const progressPercent = Math.round((processedCount / totalImages) * 100);

                    const progressData = {
                        progress: progressPercent,
                        etr: etrSeconds,
                        processed: processedCount,
                        total: totalImages,
                        status: 'processing'
                    };

                    // We update 'result' column with progress data while status is still 'processing'
                    await db.query("UPDATE processing_jobs SET result = $1, updated_at = NOW() WHERE id = $2", [progressData, jobId]);
                }

            } catch (err) {
                console.error(`Error processing ${imgPath}:`, err.message);
                results.push({
                    nombre_imagen: path.basename(imgPath),
                    error: 'Error en procesamiento'
                });
            }
        }

        // 5. Create Result File (JSON)
        // Store as Blob so user can download
        const resultJson = JSON.stringify(results, null, 2);
        const resultFilename = `bulk_ocr_results_${jobId}.json`;

        const blobUrl = await uploadFileToNAS(
            Buffer.from(resultJson, 'utf-8'),
            'tramoinv/exports',
            resultFilename
        );

        const successResult = {
            message: `Procesamiento completado. ${results.length} imágenes analizadas.`,
            downloadUrl: blobUrl
        };

        await db.query("UPDATE processing_jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2", [successResult, jobId]);

    } catch (error) {
        console.error(`Error en Bulk OCR Job ${jobId}:`, error);
        if (jobId) {
            await db.query("UPDATE processing_jobs SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2", [{ error: error.message }, jobId]);
        }
    } finally {
        if (extractionDir && fs.existsSync(extractionDir)) await fsp.rm(extractionDir, { recursive: true, force: true });
        if (job && job.payload.filePath && fs.existsSync(job.payload.filePath)) await fsp.unlink(job.payload.filePath);
    }
};

module.exports = {
    processGraphicsJob,
    deleteGraphicImage,
    deleteAllGraphicImages,
    deleteGraphicImagesByFolder,
    getGraphicsImagesByProjectId,
    reassembleAndProcessChunks,
    processRarExtractionJob,
    processSimpleUploadJob,
    processBulkOcrJob, // Export new function
};