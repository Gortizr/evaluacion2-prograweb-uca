import express from 'express';
import { menu, usuarios } from './data.js';

const app = express();
const PORT = 3000;

// Middleware para procesar JSON (necesario para el juego y el restaurante)
app.use(express.json());

// Endpoint base usando Arrow Function y Destructuring (req, res)
app.get('/', (req, res) => {
    res.send({ mensaje: 'Servidor de la Evaluacion 2 funcionando correctamente' });
});

// Endpoint para obtener el catálogo completo de Food DEI
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// Endpoint para validar el inicio de sesión
app.post('/api/login', (req, res) => {
    // Extraemos el usuario y contraseña que enviará el frontend
    const { usuario, password } = req.body;

    // Simulamos una consulta a base de datos buscando coincidencias
    const usuarioValido = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (usuarioValido) {
        // Si las credenciales coinciden, devolvemos éxito y su rol
        res.json({ exito: true, mensaje: 'Bienvenido a Food DEI', rol: usuarioValido.rol });
    } else {
        // Si fallan, devolvemos un error 401 (No autorizado)
        res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
});

// Inicialización del servidor con un Callback
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});