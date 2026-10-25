import express from 'express';
import { menu, usuarios, pedidos, reserva } from './data.js';

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

// Endpoint para consultar la reserva actual del cliente
app.get('/api/reserva', (req, res) => {
    res.json(reserva);
});

// Endpoint para agregar alimentos a la reserva
app.post('/api/reserva/agregar', (req, res) => {
    const { alimentoId, cantidad } = req.body || {};

    // Validar que los datos sean números enteros positivos
    if (!Number.isInteger(alimentoId) || !Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ mensaje: 'Datos invalidos' });
    }

    // Buscar el alimento en el menú
    const alimento = menu.find(plato => plato.id === alimentoId);

    if (!alimento) {
        return res.status(404).json({ mensaje: 'Alimento no encontrado' });
    }

    // Verificar si hay suficientes porciones
    if (alimento.stock < cantidad) {
        return res.status(400).json({ mensaje: 'Stock insuficiente' });
    }

    // Calcular el costo y verificar el saldo
    const costo = Math.round(alimento.precio * cantidad * 100) / 100;

    if (costo > reserva.saldo) {
        return res.status(400).json({ mensaje: 'Saldo insuficiente' });
    }

    // Buscar si el alimento ya está en la reserva
    const itemReservado = reserva.itemsReservados.find(
        item => item.id === alimentoId
    );

    if (itemReservado) {
        itemReservado.cantidad += cantidad;
    } else {
        reserva.itemsReservados.push({ id: alimentoId, cantidad });
    }

    // Actualizar el stock, el total y el saldo
    alimento.stock -= cantidad;
    reserva.total = Math.round((reserva.total + costo) * 100) / 100;
    reserva.saldo = Math.round((reserva.saldo - costo) * 100) / 100;

    res.json(reserva);
});

// Endpoint para actualizar las porciones de un alimento reservado
app.put('/api/reserva/actualizar-porciones/:id', (req, res) => {
    const id = Number(req.params.id);
    const { cantidad } = req.body || {};

    // Validar que los datos sean correctos
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({ mensaje: 'Datos invalidos' });
    }

    // Buscar el alimento dentro de la reserva
    const itemReservado = reserva.itemsReservados.find(
        item => item.id === id
    );

    if (!itemReservado) {
        return res.status(404).json({ mensaje: 'Alimento no reservado' });
    }

    // Buscar el alimento en el inventario
    const alimento = menu.find(plato => plato.id === id);

    if (!alimento) {
        return res.status(404).json({ mensaje: 'Alimento no encontrado' });
    }

    // Calcular la diferencia entre las porciones nuevas y las actuales
    const diferencia = cantidad - itemReservado.cantidad;

    // Validar que haya stock suficiente al aumentar las porciones
    if (diferencia > 0 && alimento.stock < diferencia) {
        return res.status(400).json({ mensaje: 'Stock insuficiente' });
    }

    // Calcular el cambio en el costo de la reserva
    const cambioCosto = Math.round(diferencia * alimento.precio * 100) / 100;

    // Validar que el cliente tenga saldo suficiente
    if (diferencia > 0 && cambioCosto > reserva.saldo) {
        return res.status(400).json({
            mensaje: 'Saldo insuficiente para esta cantidad'
        });
    }

    // Actualizar la cantidad de porciones reservadas
    itemReservado.cantidad = cantidad;

    // Actualizar el stock disponible
    alimento.stock -= diferencia;

    // Actualizar el total de la reserva y el saldo del cliente
    reserva.total = Math.round((reserva.total + cambioCosto) * 100) / 100;
    reserva.saldo = Math.round((reserva.saldo - cambioCosto) * 100) / 100;

    // Devolver la reserva actualizada
    res.json(reserva);
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

// Endpoint para registrar un nuevo pedido
app.post('/api/pedidos', (req, res) => {
    const nuevoPedido = req.body;

    // Simulamos un ID autoincrementable para la base de datos
    nuevoPedido.id = pedidos.length + 1;
    
    // Insertamos el registro en nuestra tabla en memoria
    pedidos.push(nuevoPedido);

    // Respondemos con el ticket de confirmación (Status 201: Creado)
    res.status(201).json({ exito: true, mensaje: 'Pedido registrado con éxito', ticket: nuevoPedido });
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