// Hooks de React: useState guarda datos de la pantalla y useEffect ejecuta código
// cuando el componente aparece o cuando cambia algún valor.
import { useState, useEffect } from 'react';

// Componentes de Reactstrap
import {
  Alert, Badge, Button, ButtonGroup, Card, CardBody, Col, Container,
  ListGroup, ListGroupItem, Row, Spinner, UncontrolledAlert
} from 'reactstrap';

// Archivo de estilos del caso de negocio.
import './casoNegocio.css';

// Tiempo límite de la reserva: 2 minutos expresados en segundos.
const TIEMPO_LIMITE = 2 * 60;

// Clave de localStorage donde se guarda la hora (en milisegundos) en que vence
// la reserva. Así el tiempo no se reinicia aunque se recargue la página.
const CLAVE_RESERVA = 'food-dei-reserva';

// Función que convierte un número a formato de dinero: 5.5 -> "$5.50".
function formatoDinero(valor) {
  return `$${Number(valor).toFixed(2)}`;
}

// Función que convierte segundos a formato mm:ss: 125 -> "02:05".
function formatoTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

// Función genérica que habla con el backend usando promesas (fetch + async/await).
// Si Express responde con error (400, 404), lanzamos un Error con su mensaje
// para que el catch del componente lo muestre en el UncontrolledAlert.
async function llamarApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = { method: metodo, headers: {} };

  if (cuerpo !== null) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  // El proxy de vite.config.js manda "/api/..." al servidor Express (puerto 3000).
  const respuesta = await fetch(ruta, opciones);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error en el servidor.');
  }

  return datos;
}

function CasoDeNegocio() {
  // Arreglo (array) con los platos del menú que devuelve GET /api/menu.
  const [menu, setMenu] = useState([]);

  // Objeto con la reserva que devuelve GET /api/reserva.
  const [reserva, setReserva] = useState({ saldo: 0, itemsReservados: [], total: 0 });

  // Texto del error que mandó el backend (string vacío = no hay error).
  const [error, setError] = useState('');

  // Contador que cambia con cada error para que el alerta vuelva a aparecer.
  const [idError, setIdError] = useState(0);

  // Booleano: true mientras esperamos una respuesta de Express ("Cargando...").
  const [cargando, setCargando] = useState(true);

  // Segundos que le quedan al usuario para completar su reserva.
  // Hora exacta en que vence la reserva (se lee de localStorage al abrir).
  // null = todavía no se ha iniciado una reserva.
  const [vence, setVence] = useState(() => Number(localStorage.getItem(CLAVE_RESERVA)) || null);

  // Hora actual; se actualiza cada segundo para recalcular el tiempo restante.
  const [ahora, setAhora] = useState(Date.now());

  // Segundos que faltan, calculados con la hora guardada (no se pierden al recargar).
  const tiempoRestante = vence ? Math.max(0, Math.ceil((vence - ahora) / 1000)) : TIEMPO_LIMITE;

  // Booleano: true cuando el usuario ya presionó "Iniciar reserva".
  const reservaIniciada = vence !== null;

  // Booleano: true cuando el tiempo se terminó y la reserva se cerró.
  const [reservaCerrada, setReservaCerrada] = useState(false);

  // Booleano: true cuando el usuario confirma su reserva.
  const [confirmada, setConfirmada] = useState(() => localStorage.getItem(`${CLAVE_RESERVA}-ok`) === 'true');

  // Función que pide el menú y la reserva al mismo tiempo (Promise.all).
  async function cargarDatos() {
    const [datosMenu, datosReserva] = await Promise.all([
      llamarApi('/api/menu'),
      llamarApi('/api/reserva')
    ]);
    setMenu(datosMenu);
    setReserva(datosReserva);
  }

  // Muestra el mensaje de error del backend en la parte superior.
  function mostrarError(mensaje) {
    setError(mensaje);
    setIdError(anterior => anterior + 1);
  }

  // Ejecuta cualquier acción contra el backend con el estado "Cargando...".
  // Después de cada cambio se vuelve a pedir el menú y la reserva para que
  // el stock, el total y el saldo se actualicen en tiempo real.
  async function ejecutarAccion(accion) {
    setCargando(true);
    setError('');

    try {
      await accion();
      await cargarDatos();
    } catch (err) {
      mostrarError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // useEffect #1: al abrir la pantalla se cargan los datos del backend.
  useEffect(() => {
    document.title = 'Caso de negocio - Food DEI';

    cargarDatos()
      .catch(() => mostrarError('No hay conexión con el servidor. Verifica que esté encendido.'))
      .finally(() => setCargando(false));
  }, []);

  // useEffect #2: cuenta regresiva de un segundo mientras la reserva esté abierta.
  useEffect(() => {
    if (!reservaIniciada || reservaCerrada || confirmada) return;

    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    // Limpiamos el intervalo cuando el componente cambia o desaparece.
    return () => clearInterval(intervalo);
  }, [reservaIniciada, reservaCerrada, confirmada]);

  // useEffect #3: cuando el tiempo llega a 0 se cierra la reserva.
  useEffect(() => {
    if (!reservaIniciada || tiempoRestante > 0 || reservaCerrada || confirmada || cargando) return;

    setReservaCerrada(true);
    localStorage.removeItem(CLAVE_RESERVA);

    // Se liberan todos los platos usando el Endpoint 5 (DELETE) para que el
    // stock regrese al menú general y el saldo vuelva al usuario.
    ejecutarAccion(async () => {
      for (const item of reserva.itemsReservados) {
        await llamarApi(`/api/reserva/eliminar/${item.id}`, 'DELETE');
      }
    });
  }, [reservaIniciada, tiempoRestante, reservaCerrada, confirmada, cargando]);

  // Endpoint 3: POST /api/reserva/agregar
  function agregarPlato(alimentoId) {
    ejecutarAccion(() =>
      llamarApi('/api/reserva/agregar', 'POST', { alimentoId: alimentoId, cantidad: 1 })
    );
  }

  // Endpoint 4: PUT /api/reserva/actualizar-porciones/:id
  function cambiarPorciones(id, nuevaCantidad) {
    // Si baja a 0 porciones, lo correcto es quitar el plato (Endpoint 5).
    if (nuevaCantidad < 1) {
      quitarPlato(id);
      return;
    }

    ejecutarAccion(() =>
      llamarApi(`/api/reserva/actualizar-porciones/${id}`, 'PUT', { cantidad: nuevaCantidad })
    );
  }

  // Endpoint 5: DELETE /api/reserva/eliminar/:id
  function quitarPlato(id) {
    ejecutarAccion(() => llamarApi(`/api/reserva/eliminar/${id}`, 'DELETE'));
  }

  // Confirmar la reserva: el stock ya quedó bloqueado en el backend.
  function confirmarReserva() {
    localStorage.removeItem(CLAVE_RESERVA);
    localStorage.setItem(`${CLAVE_RESERVA}-ok`, 'true');
    setConfirmada(true);
  }

  // Reinicia el contador para iniciar una nueva reserva.
  // También se usa para el botón "Iniciar reserva": guarda en localStorage
  // la hora en que vence para que el tiempo se mantenga al recargar.
  function iniciarNuevaReserva() {
    const fin = Date.now() + TIEMPO_LIMITE * 1000;
    localStorage.setItem(CLAVE_RESERVA, String(fin));
    localStorage.removeItem(`${CLAVE_RESERVA}-ok`);
    setVence(fin);
    setAhora(Date.now());
    setReservaCerrada(false);
    setConfirmada(false);
    setError('');
  }

  // El backend solo guarda { id, cantidad }; con map + find unimos cada item
  // con la información del menú (nombre y precio).
  const itemsConDetalle = reserva.itemsReservados.map(item => {
    const plato = menu.find(p => p.id === item.id);
    return {
      id: item.id,
      cantidad: item.cantidad,
      nombre: plato ? plato.nombre : `Plato #${item.id}`,
      precio: plato ? plato.precio : 0
    };
  });

  // Booleano: el usuario puede modificar la reserva solo si sigue abierta.
  const puedeEditar = !cargando && reservaIniciada && !reservaCerrada && !confirmada;

  return (
    <div className="caso-negocio">
      {/* Panel superior: información fija del usuario */}
      <Alert color="info" className="caso-negocio__panel">
        <div>
          <h2 className="caso-negocio__titulo">Food DEI</h2>
          <span>Tu saldo actual: <strong>{formatoDinero(reserva.saldo)}</strong></span>
        </div>

        <div className="caso-negocio__resumen">
          <span>
            Total de tu Reserva:{' '}
            <Badge color="dark" pill>{formatoDinero(reserva.total)}</Badge>
          </span>
          <span>
            Tiempo restante:{' '}
            <Badge color={tiempoRestante <= 60 ? 'danger' : 'primary'} pill>
              {formatoTiempo(Math.max(tiempoRestante, 0))}
            </Badge>
          </span>
          {cargando && (
            <span className="caso-negocio__cargando">
              <Spinner size="sm" /> Cargando...
            </span>
          )}
        </div>
      </Alert>

      {/* Errores del backend: regla de negocio que se rompió */}
      {error && (
        <UncontrolledAlert key={idError} color="warning">
          {error}
        </UncontrolledAlert>
      )}

      {!reservaIniciada && !reservaCerrada && !confirmada && (
        <Alert color="secondary">
          Presiona el botón para iniciar tu reserva. Tendrás {TIEMPO_LIMITE / 60} minutos para completarla.
          <div className="mt-2">
            <Button color="dark" size="sm" disabled={cargando} onClick={iniciarNuevaReserva}>
              Iniciar reserva
            </Button>
          </div>
        </Alert>
      )}

      {reservaCerrada && (
        <Alert color="danger">
          Se terminó el tiempo y tu reserva se cerró. Los platos regresaron al menú.
          <div className="mt-2">
            <Button color="danger" size="sm" onClick={iniciarNuevaReserva}>
              Iniciar reserva nuevamente
            </Button>
          </div>
        </Alert>
      )}

      {confirmada && (
        <Alert color="success">
          ¡Reserva confirmada! Total pagado: {formatoDinero(reserva.total)}.
          <div className="mt-2">
            <Button color="success" size="sm" onClick={iniciarNuevaReserva}>
              Iniciar nueva reserva
            </Button>
          </div>
        </Alert>
      )}

      <Container fluid className="p-0">
        <Row>
          {/* Menú del día: consume Endpoint 1 y 3 */}
          <Col xs="12" lg="8">
            <h3 className="caso-negocio__subtitulo">El Menú del Día</h3>
            <Row>
              {menu.map(plato => (
                <Col xs="12" md="4" key={plato.id}>
                  <Card className="mb-3">
                    <CardBody>
                      <h5>{plato.nombre}</h5>
                      <p className="text-muted mb-2">{plato.categoria}</p>
                      <p className="mb-1">
                        Precio: <Badge color="success">{formatoDinero(plato.precio)}</Badge>
                      </p>
                      <p>Stock disponible: <strong>{plato.stock}</strong></p>

                      {plato.stock === 0 ? (
                        <Button color="secondary" disabled block>Agotado</Button>
                      ) : (
                        <Button
                          color="primary"
                          block
                          disabled={!puedeEditar}
                          onClick={() => agregarPlato(plato.id)}
                        >
                          Añadir a la Reserva
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          {/* Bandeja de reserva lateral: consume Endpoint 2, 4 y 5 */}
          <Col xs="12" lg="4">
            <h3 className="caso-negocio__subtitulo">Tu Bandeja de Reserva</h3>

            {itemsConDetalle.length === 0 ? (
              <p className="text-muted">Todavía no has agregado platos.</p>
            ) : (
              <ListGroup className="mb-3">
                {itemsConDetalle.map(item => (
                  <ListGroupItem key={item.id} className="caso-negocio__item">
                    <div>
                      <strong>{item.nombre}</strong>
                      <div className="text-muted small">
                        {item.cantidad} x {formatoDinero(item.precio)}
                      </div>
                    </div>

                    <div className="caso-negocio__controles">
                      <ButtonGroup size="sm">
                        <Button
                          color="secondary"
                          disabled={!puedeEditar}
                          onClick={() => cambiarPorciones(item.id, item.cantidad - 1)}
                        >
                          -
                        </Button>
                        <Button color="light" disabled>{item.cantidad}</Button>
                        <Button
                          color="secondary"
                          disabled={!puedeEditar}
                          onClick={() => cambiarPorciones(item.id, item.cantidad + 1)}
                        >
                          +
                        </Button>
                      </ButtonGroup>

                      <Button
                        color="danger"
                        outline
                        size="sm"
                        disabled={!puedeEditar}
                        onClick={() => quitarPlato(item.id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}

            <Button
              color="success"
              block
              disabled={!puedeEditar || itemsConDetalle.length === 0}
              onClick={confirmarReserva}
            >
              Confirmar reserva
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

// Permite que App.jsx importe este componente.
export default CasoDeNegocio;
