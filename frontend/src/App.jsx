
  // Importamos nuestro juego desde la carpeta ejercicio1.
  import AdivinaNumero from './ejercicio1/AdivinaNumero.jsx';

  // App es el componente principal de nuestra aplicación.
  function App() {
    return (
      <div>
        {/* Mostramos el frontend del ejercicio 1 */}
        <AdivinaNumero />
      </div>
    );
  }

  // Exportamos App para utilizarlo en main.jsx.
  export default App;
