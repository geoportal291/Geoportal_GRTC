const db = require('./conexion');
db.query('SELECT * FROM public.suelos_diccionario_nlp LIMIT 50')
    .then(r => {
        console.log(JSON.stringify(r.rows, null, 2));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
