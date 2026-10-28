// React conserva solo los datos necesarios para dibujar la respuesta del servidor.
import { useEffect, useState } from 'react';

import {
  Alert, Badge, Button, ButtonGroup, Card, CardBody, Col, Container,
  ListGroup, ListGroupItem, Row, Spinner, UncontrolledAlert
} from 'reactstrap';

import './casoNegocio.css';

function formatoDinero(valor) {
  return `$${Number(valor).toFixed(2)}`;
}

function formatoTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

// Todas las reglas de negocio y respuestas de error vienen de Express.
async function llamarApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = { method: metodo, headers: {} };

  if (cuerpo !== null) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(ruta, opciones);
  let datos = {};

  try {
    datos = await respuesta.json();
  } catch {
    // La respuesta puede no incluir JSON, por ejemplo ante un error del servidor.
  }

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error en el servidor.');
  }

  return datos;
}

// El menú y la reserva son las fuentes para la interfaz.
async function leerEstadoFoodDei() {
  const [menu, reserva] = await Promise.all([
    llamarApi('/api/menu'),
    llamarApi('/api/reserva')
  ]);

  // Solo se usa como referencia para dibujar el contador; no vence la reserva.
  return { menu, reserva, horaConsulta: Date.now() };
}

function CasoDeNegocio() {
  const [menu, setMenu] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [ahora, setAhora] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [idError, setIdError] = useState(0);

  // El único vencimiento válido es el que entrega Express.
  // Este cálculo solo representa segundos restantes en pantalla.
  const vencimientoMs = reserva?.venceEn
    ? new Date(reserva.venceEn).getTime()
    : null;
  const tiempoRestante =
    reserva?.estado === 'activa' && Number.isFinite(vencimientoMs)
      ? Math.max(0, Math.ceil((vencimientoMs - ahora) / 1000))
      : null;

  function mostrarError(mensaje) {
    setError(mensaje);
    setIdError(anterior => anterior + 1);
  }

  // La carga inicial solo lee datos; no crea ni modifica una reserva.
  useEffect(() => {
    let componenteMontado = true;
    document.title = 'Caso de negocio - Food DEI';

    async function cargarDatos() {
      try {
        const datos = await leerEstadoFoodDei();
        if (!componenteMontado) return;

        setMenu(datos.menu);
        setReserva(datos.reserva);
        setAhora(datos.horaConsulta);
      } catch {
        if (componenteMontado) {
          setError('No hay conexión con el servidor. Verifica que esté encendido.');
          setIdError(anterior => anterior + 1);
        }
      } finally {
        if (componenteMontado) setCargando(false);
      }
    }

    void cargarDatos();

    return () => {
      componenteMontado = false;
    };
  }, []);

  // El intervalo solo actualiza el reloj visual. Al alcanzar la fecha
  // del servidor, React vuelve a leer la reserva; Express aplica el vencimiento.
  useEffect(() => {
    if (
      cargando ||
      reserva?.estado !== 'activa' ||
      !reserva?.venceEn ||
      !Number.isFinite(vencimientoMs)
    ) {
      return undefined;
    }

    let efectoActivo = true;
    let consultandoServidor = false;

    async function actualizarVista() {
      const horaActual = Date.now();
      setAhora(horaActual);

      if (horaActual < vencimientoMs || consultandoServidor) return;

      consultandoServidor = true;
      try {
        const datos = await leerEstadoFoodDei();
        if (!efectoActivo) return;

        setMenu(datos.menu);
        setReserva(datos.reserva);
        setAhora(datos.horaConsulta);
      } catch {
        // Se intenta de nuevo en el siguiente tick; el frontend no cambia el estado.
      } finally {
        consultandoServidor = false;
      }
    }

    const intervalo = window.setInterval(actualizarVista, 1000);

    return () => {
      efectoActivo = false;
      window.clearInterval(intervalo);
    };
  }, [cargando, reserva?.estado, reserva?.venceEn, vencimientoMs]);

  // Envía la acción a Express y vuelve a leer el estado, incluso si la API
  // rechaza la solicitud, para que la interfaz no conserve datos obsoletos.
  async function ejecutarAccion(accion) {
    setCargando(true);
    setError('');
    let mensajeError = '';

    try {
      await accion();
    } catch (err) {
      mensajeError = err.message || 'No se pudo completar la acción.';
    }

    try {
      const datos = await leerEstadoFoodDei();
      setMenu(datos.menu);
      setReserva(datos.reserva);
      setAhora(datos.horaConsulta);
    } catch {
      if (!mensajeError) {
        mensajeError = 'No se pudo actualizar la información del servidor.';
      }
    } finally {
      setCargando(false);
    }

    if (mensajeError) mostrarError(mensajeError);
  }

  // Las operaciones cambian el backend; React solo refleja el nuevo snapshot.
  function agregarPlato(alimentoId) {
    return ejecutarAccion(() =>
      llamarApi('/api/reserva/agregar', 'POST', { alimentoId, cantidad: 1 })
    );
  }

  function actualizarPorciones(id, cantidad) {
    return ejecutarAccion(() =>
      llamarApi(`/api/reserva/actualizar-porciones/${id}`, 'PUT', { cantidad })
    );
  }

  function quitarPlato(id) {
    return ejecutarAccion(() =>
      llamarApi(`/api/reserva/eliminar/${id}`, 'DELETE')
    );
  }

  function confirmarReserva() {
    return ejecutarAccion(() =>
      llamarApi('/api/reserva/confirmar', 'POST', {})
    );
  }

  // Une la cantidad reservada con nombre y precio únicamente para mostrarla.
  const itemsConDetalle = (reserva?.itemsReservados || []).map(item => {
    const plato = menu.find(elemento => elemento.id === item.id);

    return {
      id: item.id,
      cantidad: item.cantidad,
      nombre: plato ? plato.nombre : `Plato #${item.id}`,
      precio: plato ? plato.precio : 0
    };
  });

  if (!reserva) {
    return (
      <div className="caso-negocio">
        {error ? (
          <UncontrolledAlert key={idError} color="warning">
            {error}
          </UncontrolledAlert>
        ) : (
          <Alert color="info">
            <Spinner size="sm" /> Conectando con Express...
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="caso-negocio">
      <Alert color="info" className="caso-negocio__panel">
        <div>
          <h2 className="caso-negocio__titulo">Food DEI</h2>
          <span>
            Tu saldo actual: <strong>{formatoDinero(reserva.saldo)}</strong>
          </span>
        </div>

        <div className="caso-negocio__resumen">
          <span>
            Total de tu Reserva:{' '}
            <Badge color="dark" pill>{formatoDinero(reserva.total)}</Badge>
          </span>
          <span>
            Estado:{' '}
            <Badge
              color={
                reserva.estado === 'confirmada'
                  ? 'success'
                  : reserva.estado === 'vencida'
                    ? 'danger'
                    : 'primary'
              }
              pill
            >
              {reserva.estado}
            </Badge>
          </span>
          {tiempoRestante !== null && (
            <span>
              Tiempo restante:{' '}
              <Badge color={tiempoRestante <= 60 ? 'danger' : 'primary'} pill>
                {formatoTiempo(tiempoRestante)}
              </Badge>
            </span>
          )}
          {cargando && (
            <span className="caso-negocio__cargando">
              <Spinner size="sm" /> Cargando...
            </span>
          )}
        </div>
      </Alert>

      {error && (
        <UncontrolledAlert key={idError} color="warning">
          {error}
        </UncontrolledAlert>
      )}

      {reserva.estado === 'sin iniciar' && (
        <Alert color="secondary">
          Añade un plato para comenzar. Express inicia el plazo cuando registra
          el primer alimento.
        </Alert>
      )}

      {reserva.estado === 'vencida' && (
        <Alert color="danger">
          Express cerró la reserva y actualizó el saldo y el stock. Puedes
          iniciar otra añadiendo un plato del menú.
        </Alert>
      )}

      {reserva.estado === 'confirmada' && (
        <Alert color="success">
          <strong>¡Reserva confirmada!</strong>{' '}
          Total pagado: {formatoDinero(reserva.total)}.
        </Alert>
      )}

      <Container fluid className="p-0">
        <Row>
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
                        Precio:{' '}
                        <Badge color="success">{formatoDinero(plato.precio)}</Badge>
                      </p>
                      <p>
                        Stock disponible: <strong>{plato.stock}</strong>
                      </p>

                      {plato.stock === 0 ? (
                        <Button color="secondary" disabled block>
                          Agotado
                        </Button>
                      ) : reserva.estado === 'confirmada' ? (
                        <Button color="secondary" disabled block>
                          Reserva confirmada
                        </Button>
                      ) : (
                        <Button
                          color="primary"
                          block
                          disabled={cargando}
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

          <Col xs="12" lg="4">
            <h3 className="caso-negocio__subtitulo">
              {reserva.estado === 'confirmada'
                ? 'Resumen final del pedido'
                : 'Tu Bandeja de Reserva'}
            </h3>

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

                    {reserva.estado !== 'confirmada' && (
                      <div className="caso-negocio__controles">
                        <ButtonGroup size="sm">
                          <Button
                            color="secondary"
                            disabled={cargando || item.cantidad <= 1}
                            onClick={() =>
                              actualizarPorciones(item.id, item.cantidad - 1)
                            }
                          >
                            -
                          </Button>
                          <Button color="light" disabled>
                            {item.cantidad}
                          </Button>
                          <Button
                            color="secondary"
                            disabled={cargando}
                            onClick={() =>
                              actualizarPorciones(item.id, item.cantidad + 1)
                            }
                          >
                            +
                          </Button>
                        </ButtonGroup>

                        <Button
                          color="danger"
                          outline
                          size="sm"
                          disabled={cargando}
                          onClick={() => quitarPlato(item.id)}
                        >
                          Quitar
                        </Button>
                      </div>
                    )}
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}

            {reserva.estado === 'activa' && itemsConDetalle.length > 0 && (
              <Button
                color="success"
                block
                disabled={cargando}
                onClick={confirmarReserva}
              >
                Confirmar reserva
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default CasoDeNegocio;
