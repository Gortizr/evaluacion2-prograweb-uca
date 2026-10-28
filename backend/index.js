import express from 'express';
import { menu, reserva } from './data.js';

const TIEMPO_RESERVA_MS = 5 * 60 * 1000;

// Inicia el tiempo límite de una reserva
function iniciarReserva() {
    reserva.estado = 'activa';

    const vencimiento = new Date(
        Date.now() + TIEMPO_RESERVA_MS
    ).toISOString();

    reserva.venceEn = vencimiento;

    // Cancelar automáticamente si no se confirma en 5 minutos
    setTimeout(() => {
        if (
            reserva.estado === 'activa' &&
            reserva.venceEn === vencimiento
        ) {
            vencerReserva();
        }
    }, TIEMPO_RESERVA_MS);
}

// Cancela una reserva cuando se agota el tiempo
function vencerReserva() {
    // Solo pueden vencer las reservas activas
    if (reserva.estado !== 'activa') {
        return;
    }

    // Devolver las porciones al inventario
    for (const item of reserva.itemsReservados) {
        const alimento = menu.find(plato => plato.id === item.id);

        if (alimento) {
            alimento.stock += item.cantidad;
        }
    }

    // Devolver el dinero al saldo del cliente
    reserva.saldo = Math.round(
        (reserva.saldo + reserva.total) * 100
    ) / 100;

    // Limpiar los alimentos y cerrar la reserva
    reserva.itemsReservados = [];
    reserva.total = 0;
    reserva.estado = 'vencida';
    reserva.venceEn = null;
}

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

// Endpoint para confirmar la reserva del cliente
app.post('/api/reserva/confirmar', (req, res) => {

    // Verificar que exista una reserva activa
    if (reserva.estado !== 'activa') {
        return res.status(400).json({
            mensaje: 'No hay una reserva activa para confirmar'
        });
    }

    // Verificar que no hayan pasado los 5 minutos
    if (Date.now() >= new Date(reserva.venceEn).getTime()) {
        vencerReserva();

        return res.status(410).json({
            mensaje: 'La reserva ha vencido'
        });
    }

    // Verificar que haya alimentos reservados
    if (reserva.itemsReservados.length === 0) {
        return res.status(400).json({
            mensaje: 'No hay alimentos para confirmar'
        });
    }

    // Confirmar la reserva
    reserva.estado = 'confirmada';
    reserva.venceEn = null;

    res.json({
        mensaje: 'Reserva confirmada correctamente',
        reserva
    });
});

// Endpoint para agregar alimentos a la reserva
app.post('/api/reserva/agregar', (req, res) => {

    // Impedir modificaciones después de confirmar la reserva
    if (reserva.estado === 'confirmada') {
        return res.status(409).json({
            mensaje: 'La reserva ya fue confirmada y no se puede modificar'
        });
    }

    // Comprobar si una reserva activa ya superó su tiempo límite
    if (
        reserva.estado === 'activa' &&
        Date.now() >= new Date(reserva.venceEn).getTime()
    ) {
        vencerReserva();
    }

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

    // Iniciar los 5 minutos solamente al comenzar una reserva
    if (reserva.estado === 'sin iniciar' || reserva.estado === 'vencida') {
    iniciarReserva();
    }

    // Actualizar el stock, el total y el saldo
    alimento.stock -= cantidad;
    reserva.total = Math.round((reserva.total + costo) * 100) / 100;
    reserva.saldo = Math.round((reserva.saldo - costo) * 100) / 100;

    res.json(reserva);
});

// Endpoint para actualizar las porciones de un alimento reservado
app.put('/api/reserva/actualizar-porciones/:id', (req, res) => {

    // Comprobar si la reserva ha vencido
    if (
        reserva.estado === 'activa' &&
        Date.now() >= new Date(reserva.venceEn).getTime()
    ) {
        vencerReserva();

        return res.status(410).json({
            mensaje: 'La reserva ha vencido'
        });
    }

    // Solo se pueden modificar reservas activas
    if (reserva.estado !== 'activa') {
        return res.status(409).json({
            mensaje: 'Solo se puede modificar una reserva activa'
        });
    }

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

// Endpoint para eliminar un alimento de la reserva
app.delete('/api/reserva/eliminar/:id', (req, res) => {

    // Comprobar si la reserva ha vencido
    if (
        reserva.estado === 'activa' &&
        Date.now() >= new Date(reserva.venceEn).getTime()
    ) {
        vencerReserva();

        return res.status(410).json({
            mensaje: 'La reserva ha vencido'
        });
    }

    // Solo se pueden eliminar alimentos de reservas activas
    if (reserva.estado !== 'activa') {
        return res.status(409).json({
            mensaje: 'Solo se pueden eliminar alimentos de una reserva activa'
        });
    }

    const id = Number(req.params.id);

    // Validar que el ID sea correcto
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensaje: 'Datos invalidos' });
    }

    // Buscar el alimento dentro de la reserva
    const itemReservado = reserva.itemsReservados.find(
        item => item.id === id
    );

    if (!itemReservado) {
        return res.status(404).json({ mensaje: 'Alimento no reservado' });
    }

    // Buscar el alimento en el menú
    const alimento = menu.find(plato => plato.id === id);

    if (!alimento) {
        return res.status(404).json({ mensaje: 'Alimento no encontrado' });
    }

    // Calcular el dinero que se devolverá al cliente
    const costoDevuelto = Math.round(
        alimento.precio * itemReservado.cantidad * 100
    ) / 100;

    // Devolver las porciones al inventario
    alimento.stock += itemReservado.cantidad;

    // Devolver el dinero al saldo y actualizar el total
    reserva.saldo = Math.round((reserva.saldo + costoDevuelto) * 100) / 100;
    reserva.total = Math.round((reserva.total - costoDevuelto) * 100) / 100;

    // Eliminar el alimento del arreglo de productos reservados
    reserva.itemsReservados = reserva.itemsReservados.filter(
        item => item.id !== id
    );

    // Reiniciar la reserva si el cliente eliminó todos los alimentos
    if (reserva.itemsReservados.length === 0) {
    reserva.estado = 'sin iniciar';
    reserva.venceEn = null;
    }

    // Devolver la reserva actualizada
    res.json(reserva);
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