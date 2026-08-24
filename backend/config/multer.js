/**
 * Configuración de multer compartida por todos los routers.
 * Extraída de index.js sin modificar una línea (fase B4).
 */

const multer = require('multer');
const fs = require('fs');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 500
    }
});

// Disk Storage for Bulk Uploads
const storageDisk = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = '/tmp/multer_disk';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const uploadDisk = multer({
    storage: storageDisk,
    limits: {
        fileSize: 1024 * 1024 * 500 // 500MB per file
    }
});

module.exports = { upload, uploadDisk };
