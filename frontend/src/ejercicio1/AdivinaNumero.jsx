// React nos permite guardar los datos de la pantalla y usar el hook useEffect.
import { useState, useEffect } from 'react';

// Estos componentes vienen de Reactstrap (la librería ya está en package.json).
import { Alert, Button, Card, CardBody, Form, FormGroup, Input, Label } from 'reactstrap';

// Archivo de estilos SOLO del ejercicio 1; no modifica el ejercicio 2.
import './adivina.css';

function AdivinaNumero() {
  // Valor que el usuario escribe en el campo de número.
  const [numero, setNumero] = useState('');

  // Mensaje que aparece en la pantalla: pista, victoria o error.
  const [mensaje, setMensaje] = useState('Escribe un número entre 1 y 100.');

  // Arreglo con los intentos que NO acertaron el número secreto.
  const [intentosFallidos, setIntentosFallidos] = useState([]);

  // Arreglo con TODOS los números enviados, incluso el número ganador.
  const [historial, setHistorial] = useState([]);

  // Booleano: false cuando todavía no gana, true cuando acierta.
  const [gano, setGano] = useState(false);

  // Booleano que desactiva botones mientras esperamos al servidor.
  const [cargando, setCargando] = useState(false);

  // useEffect se ejecuta cuando se muestra este componente por primera vez.
  useEffect(() => {
    document.title = 'Ejercicio 1 - Adivina el Número';
    fetch('/reset', { method: 'POST' });
  }, []);

  // Se ejecuta al presionar el botón "Probar número" del formulario.
  async function enviarIntento(evento) {
    // Evita que el formulario recargue toda la página.
    evento.preventDefault();

    // Convierte el texto del input a un número para enviarlo al backend.
    const intento = Number(numero);

    // Validamos el número antes de llamar al servidor.
    if (numero === '' || !Number.isInteger(intento) || intento < 1 || intento > 100) {
      setMensaje('Debes escribir un número entero entre 1 y 100.');
      return;
    }

    // Se bloquea temporalmente el botón para evitar solicitudes repetidas.
    setCargando(true);

    try {
      // fetch envía una solicitud al backend.
      // El proxy de vite.config.js la manda al servidor Express (puerto 3000).
      const respuesta = await fetch('/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intento: intento })
      });

      // Convierte la respuesta JSON del servidor en un objeto JavaScript.
      const datos = await respuesta.json();

      // Si el servidor rechazó el intento, mostramos su mensaje de error.
      if (!respuesta.ok) {
        setMensaje(datos.error || 'No se pudo enviar el número.');
        return;
      }

      // Agregamos el número al historial completo sin borrar los anteriores.
      setHistorial(anteriores => [...anteriores, intento]);

      // El backend devuelve mensaje: "mayor", "menor" o "correcto".
      if (datos.mensaje === 'correcto') {
        setGano(true);
        setMensaje('¡Correcto! ¡Adivinaste el número secreto!');
      } else {
        // Guardamos este intento porque no fue el correcto.
        setIntentosFallidos(anteriores => [...anteriores, intento]);

        if (datos.mensaje === 'mayor') {
          setMensaje('El número secreto es MAYOR. Prueba otro número.');
        } else if (datos.mensaje === 'menor') {
          setMensaje('El número secreto es MENOR. Prueba otro número.');
        } else {
          setMensaje('Recibimos una respuesta que no conocemos.');
        }
      }

      // Se limpia el campo después de cada intento válido enviado.
      setNumero('');
    } catch (error) {
      // Entra aquí si no hay conexión con Express o sucede un error de red.
      console.error(error);
      setMensaje('No hay conexión con el servidor. Verifica que esté encendido.');
    } finally {
      // Se ejecuta aunque haya éxito o error.
      setCargando(false);
    }
  }

  // Se ejecuta al presionar "Reiniciar juego".
  async function reiniciarJuego() {
    setCargando(true);

    try {
      // POST /reset le pide al servidor generar OTRO número secreto.
      const respuesta = await fetch('/reset', { method: 'POST' });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(datos.error || 'No se pudo reiniciar el juego.');
        return;
      }

      // Limpiamos los estados del frontend para iniciar una partida nueva.
      setNumero('');
      setMensaje('Juego reiniciado. ¡Adivina el nuevo número!');
      setIntentosFallidos([]);
      setHistorial([]);
      setGano(false);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo conectar con el servidor para reiniciar.');
    } finally {
      setCargando(false);
    }
  }

  // JSX: es el contenido visual que React muestra en el navegador.
  return (
    <div className="adivina">
      <Card>
        <CardBody>
          <h2>Adivina el Número</h2>
          <p>El servidor eligió un número secreto del 1 al 100.</p>

          {/* "onSubmit" conecta el formulario con la función enviarIntento. */}
          <Form onSubmit={enviarIntento}>
            <FormGroup>
              <Label for="numeroAdivina">Tu número:</Label>
              <Input
                id="numeroAdivina"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="Ejemplo: 50"
                value={numero}
                onChange={evento => setNumero(evento.target.value)}
                disabled={gano || cargando}
              />
            </FormGroup>

            <Button color="primary" type="submit" disabled={gano || cargando}>
              {cargando ? 'Enviando...' : 'Probar número'}
            </Button>
          </Form>

          {/* Reactstrap muestra el mensaje del servidor en un recuadro. */}
          <Alert color={gano ? 'success' : 'info'} className="mt-3">
            {mensaje}
          </Alert>

          <p><strong>Intentos fallidos:</strong> {intentosFallidos.length}</p>

          <h3>Historial de intentos</h3>
          {historial.length === 0 ? (
            <p>Todavía no has probado ningún número.</p>
          ) : (
            <ol>
              {/* map recorre el arreglo y crea un elemento por cada número. */}
              {historial.map((valor, posicion) => (
                <li key={posicion}>{valor}</li>
              ))}
            </ol>
          )}

          <Button color="secondary" outline type="button" onClick={reiniciarJuego} disabled={cargando}>
            Reiniciar juego
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

// Permite que App.jsx importe este componente.
export default AdivinaNumero;
