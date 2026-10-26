
  // Importamos nuestro juego desde la carpeta ejercicio1.
  import AdivinaNumero from './ejercicio1/AdivinaNumero.jsx';

  // Importamos el caso de negocio Food DEI desde su propia carpeta.
  import CasoDeNegocio from './casoDeNegocio/casoNegocio.jsx';

  // App es el componente principal de nuestra aplicación.
  function App() {
    return (
      <div>
        {/* Mostramos el frontend del ejercicio 1 */}
        <AdivinaNumero />

        {/* Mostramos el caso de negocio por separado, debajo del ejercicio 1 */}
        <CasoDeNegocio />
      </div>
    );
  }

  // Exportamos App para utilizarlo en main.jsx.
  export default App;
