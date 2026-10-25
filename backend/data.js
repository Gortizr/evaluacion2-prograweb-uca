// Catálogo del restaurante Food DEI
export const menu = [
    {
        id: 1,
        nombre: 'Chaomein con Camarón',
        precio: 8.50,
        categoria: 'Plato Principal',
        stock: 12
    },
    {
        id: 2,
        nombre: 'Pizza Grande de Pepperoni',
        precio: 10.99,
        categoria: 'Plato Principal',
        stock: 8
    },
    {
        id: 3,
        nombre: 'Café Americano',
        precio: 3.25,
        categoria: 'Bebida',
        stock: 20
    }
];

// Reserva actual del cliente
export const reserva = {
    saldo: 25.00,
    itemsReservados: [],
    total: 0
};