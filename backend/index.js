import express from 'express';

const app = express();
const PORT = 3000;

// Middleware para procesar JSON (necesario para el juego y el restaurante)
app.use(express.json());

// Endpoint base usando Arrow Function y Destructuring (req, res)
app.get('/', (req, res) => {
    res.send({ mensaje: 'Servidor de la Evaluacion 2 funcionando correctamente' });
});

// Inicialización del servidor con un Callback
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});