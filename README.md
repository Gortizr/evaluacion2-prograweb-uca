Evaluación II - Programación Web (Ciclo 02)

Desarrollo de Aplicaciones Web con integración de Frontend y Backend mediante una API REST. Este proyecto resuelve dos problemáticas de negocio aplicando manejo de estados, promesas y componentes de UI.

Casos de Uso Implementados

Ejercicio 1: "Adivina el Número"

Juego interactivo donde el usuario debe adivinar un número aleatorio del 1 al 100 generado en el servidor.

Historial de intentos y respuestas dinámicas ("mayor", "menor", "correcto").

Caso de Negocio: Food DEI S.A. de R.L.

Sistema de reserva de alimentos (Carrito de compras).

Gestión de inventario de platos limitados en tiempo real.

Validación estricta de stock disponible y presupuesto (saldo) del usuario.

Vencimiento de reserva y actualización dinámica de porciones.

Equipo de Trabajo

Erick Alejandro Mejicanos Mariona 00057324

Guillermo Andrés Ortiz Reyes 00131725

Angel Leonel Choto Garcia 00185725

José Ariel Álvarez Morales 00034725

Tecnologías Utilizadas

Frontend: React 19, Vite, Reactstrap, Bootstrap 5, CSS puro.

Backend: Node.js, Express (ES Modules), manipulación de estado en memoria.

Control de Versiones: Git y GitHub (Metodología Git Flow).

Requisitos Previos

Node.js instalado (v18 o superior recomendado).

Git para clonar el repositorio.

Instrucciones de Instalación y Ejecución

Para evaluar la solución, se deben levantar ambos entornos de desarrollo (Backend y Frontend) en terminales separadas. Nota: El frontend está configurado con un proxy en Vite que redirige automáticamente las peticiones de la API al puerto del backend.

1. Despliegue del Backend

Abre una terminal en la raíz del proyecto y ejecuta:

cd backend
npm install
npm run dev


El servidor Express estará corriendo en http://localhost:3000 con node --watch.

2. Despliegue del Frontend

Abre una segunda terminal en la raíz del proyecto y ejecuta:

cd frontend
npm install
npm run dev


Vite proporcionará una URL local (generalmente http://localhost:5173) para interactuar con la aplicación.

Puntos Técnicos Destacados

Separación de responsabilidades: Uso de fetch y promesas (async/await) en el Frontend para consumir la API.

Códigos de Estado HTTP: Manejo estricto de errores (400 Bad Request, 404 Not Found) desde el Backend, capturados y mostrados al usuario con alertas de Reactstrap.

React Hooks: Implementación extensa de useState y useEffect para controlar la renderización condicional y las llamadas iniciales a la API.

## Declaración de Uso de Inteligencia Artificial

Durante el ciclo de desarrollo y preparación de esta Evaluación II, el equipo utilizó **ChatGPT** como asistente de inteligencia artificial. Su aplicación se limitó estrictamente a las siguientes tareas de apoyo:
* **Revisión técnica:** Análisis de sintaxis, depuración de errores y explicación del flujo de datos entre el Backend (Express) y el Frontend (React).
* **Documentación:** Estructuración y redacción de los comandos de despliegue en este archivo `README.md`.

Toda la arquitectura, lógica de negocio y código final fueron construidos, comprendidos y validados por los autores del equipo para garantizar el cumplimiento de las rúbricas de la asignatura.