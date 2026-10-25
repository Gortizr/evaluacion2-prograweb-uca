import express from 'express';

const app = express();
const PORT = 3000;

// Middleware para procesar JSON (necesario para el juego y el restaurante)
app.use(express.json());

// Endpoint base usando Arrow Function y Destructuring (req, res)
app.get('/', (req, res) => {
    res.send({ mensaje: 'Servidor de la Evaluacion 2 funcionando correctamente' });
});

// Ejercicio 1: Adivina el Número
let numeroOculto = Math.floor(Math.random() * 100) + 1;

app.post('/guess', (req, res) => {
    const intento = parseInt(req.body.intento, 10);
       
    if (isNaN(intento)) {
        return res.status(400).json({ error: 'Debes enviar un número válido' });
    }

    if (intento < 1 || intento > 100) {
        return res.status(400).json({ error: 'El número debe estar entre 1 y 100' });
    }

    if (numeroOculto > intento) return res.json({ mensaje: 'mayor' });
    if (numeroOculto < intento) return res.json({ mensaje: 'menor' });
    return res.json({ mensaje: 'correcto' });
});

app.post('/reset', (req, res) => {
    numeroOculto = Math.floor(Math.random() * 100) + 1;
    res.json({ mensaje: 'Juego reiniciado' });
});

// Inicialización del servidor con un Callback
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});