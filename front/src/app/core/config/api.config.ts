//export const API_BASE_URL = 'http://localhost:3000';
export const API_BASE_URL = 'https://foresite-app.onrender.com';
// Modo simulado: cuando no hay backend/BD disponible, Auth y Proyectos dejan
// de llamar al API real. Login/Registro aceptan cualquier correo y
// contraseña (siempre que pasen las validaciones del formulario), y los
// proyectos se guardan en localStorage en vez de en la base de datos.
// Para volver a usar el backend real, poner esto en `false`.
export const MOCK_MODE = false;
