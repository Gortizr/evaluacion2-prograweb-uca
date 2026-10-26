// useState permite recordar qué pantalla eligió el usuario.
import { useState } from 'react';

// Importamos los dos ejercicios que ya existen en el proyecto.
import AdivinaNumero from './ejercicio1/AdivinaNumero.jsx';
import CasoDeNegocio from './casoDeNegocio/casoNegocio.jsx';

// Aquí están los estilos de la pantalla de inicio.
import './App.css';

function App() {
  // Al abrir la página se muestra primero el inicio.
  const [pantalla, setPantalla] = useState('inicio');

  return (
    <div>
      {/* Si pantalla es "inicio", mostramos las dos opciones. */}
      {pantalla === 'inicio' ? (
        <main className="inicio">
          <div className="inicio-contenido">
            <p className="inicio-etiqueta">Evaluación II · Programación Web</p>
            <h1>¿Qué deseas hacer?</h1>
            <p className="inicio-descripcion">
              Selecciona uno de los dos ejercicios para comenzar.
            </p>

            <div className="inicio-opciones">
              {/* Botón que abre el ejercicio 1. */}
              <button
                type="button"
                className="inicio-tarjeta"
                onClick={() => setPantalla('numero')}
              >
                <span className="inicio-numero">01</span>
                <h2>Adivina el Número</h2>
                <p>Intenta encontrar el número secreto del 1 al 100.</p>
                <span className="inicio-accion">Jugar →</span>
              </button>

              {/* Botón que abre el ejercicio 2 de tu compañero. */}
              <button
                type="button"
                className="inicio-tarjeta"
                onClick={() => setPantalla('negocio')}
              >
                <span className="inicio-numero">02</span>
                <h2>Food DEI</h2>
                <p>Elige platillos y administra tu reserva de comida.</p>
                <span className="inicio-accion">Entrar →</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="vista-ejercicio">
          {/* Permite regresar a la pantalla principal. */}
          <button
            type="button"
            className="btn btn-outline-secondary mb-4"
            onClick={() => setPantalla('inicio')}
          >
            ← Volver al inicio
          </button>

          {/* Mostramos solo el ejercicio que eligió el usuario. */}
          {pantalla === 'numero' ? <AdivinaNumero /> : <CasoDeNegocio />}
        </main>
      )}
    </div>
  );
}

// Permite que main.jsx muestre esta aplicación.
export default App;
