const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 CONFIG DESDE VARIABLES DE ENTORNO
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER, // ejemplo: servidor.database.windows.net
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.post('/analizar', async (req, res) => {
    console.log("REQUEST RECIBIDO");

    const { lat, lng, subcatId, radius } = req.body;
    let scianFilter = "";

    switch (subcatId) {
        case "restaurantes":
            scianFilter = "AND scian LIKE '722%'";
            break;
        case "cafeterias":
            scianFilter = "AND scian LIKE '722515%'";
            break;
        case "farmacias":
            scianFilter = "AND scian LIKE '464111%'";
            break;
        case "tiendas":
            scianFilter = "AND scian LIKE '46%'";
            break;
        case "tecnologia":
            scianFilter = "AND scian LIKE '443%'";
            break;
    }

    if (!subcatId) {
        return res.json({
            lat, lng,
            negocios: [],
            totalNegocios: 0
        });
    }

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('lat', sql.Float, lat)
            .input('lng', sql.Float, lng)
            .input('radius', sql.Float, radius)
            .query(`
                SELECT TOP 1000 *
                FROM (
                    SELECT *,
                    (
                        6371000 * ACOS(
                            COS(RADIANS(@lat)) *
                            COS(RADIANS(latitud)) *
                            COS(RADIANS(longitud) - RADIANS(@lng)) +
                            SIN(RADIANS(@lat)) *
                            SIN(RADIANS(latitud))
                        )
                    ) AS distancia
                    FROM Negocios
                    WHERE latitud IS NOT NULL 
                    AND longitud IS NOT NULL
                    ${scianFilter}
                ) AS t
                WHERE distancia <= @radius
                ORDER BY distancia ASC
            `);

        res.json({
            lat,
            lng,
            totalNegocios: result.recordset.length,
            negocios: result.recordset.map(n => ({
                nombre: n.nombre_establecimiento,
                lat: parseFloat(n.latitud),
                lng: parseFloat(n.longitud)
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// 🔥 PUERTO DINÁMICO (OBLIGATORIO EN AZURE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('API corriendo en puerto', PORT);
});
