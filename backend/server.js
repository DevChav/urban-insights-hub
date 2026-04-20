const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'GeoMarket',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

app.post('/analizar', async (req, res) => {
    console.log("REQUEST RECIBIDO");

    const { lat, lng, subcatId, radius } = req.body;
    let scianFilter = "";

    switch (subcatId) {
    	case "restaurantes":
        	scianFilter = "AND scian LIKE '722%'"; // alimentos
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

    	default:
        	scianFilter = ""; // sin filtro
    }

    if (!subcatId) {
    	return res.json({
        	lat,
        	lng,
        	negocios: [],
        	totalNegocios: 0,
        	competidoresDirectos: 0,
        	puntuacion: 0,
        	nivelActividad: "Sin datos",
        	recomendacion: "Selecciona una categoría",
        	analisisNegocio: "",
        	subcategoriaLabel: null,
        	promedioPeatones: 0,
        	flujoVehicular: 0,
        	flujoSemanal: [],
        	distribucion: []
    	});
    }

    try {
        await sql.connect(config);

        const result = await sql.query(`
    		SELECT TOP 1000 *
    		FROM (
        		SELECT *,
        		(
            			6371000 * ACOS(
                			COS(RADIANS(${lat})) *
                			COS(RADIANS(latitud)) *
                			COS(RADIANS(longitud) - RADIANS(${lng})) +
                			SIN(RADIANS(${lat})) *
                			SIN(RADIANS(latitud))
            			)
        		) AS distancia
        		FROM Negocios
        		WHERE latitud IS NOT NULL AND longitud IS NOT NULL
			${scianFilter}
    		) AS t
    		WHERE distancia <= ${radius}
    		ORDER BY distancia ASC
	`);

        console.log("QUERY OK");

        res.json({
    		lat,
    		lng,
    		puntuacion: 7,
    		totalNegocios: result.recordset.length,
    		competidoresDirectos: 0,
    		nivelActividad: "Medio",
    		recomendacion: "Zona con actividad comercial",
    		analisisNegocio: "Datos reales desde base de datos",
    		subcategoriaLabel: subcatId,
    		promedioPeatones: 1000,
    		flujoVehicular: 2000,
    		flujoSemanal: [],
    		distribucion: [],
    		negocios: result.recordset.map(n => ({
        		nombre: n.nombre_establecimiento,
        		tipo: "Comercio",
        		lat: parseFloat(n.latitud),
        		lng: parseFloat(n.longitud)
    		}))
	});

        console.log("RESPONDIENDO");

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.listen(3001, () => {
    console.log('API corriendo en http://localhost:3001');
});