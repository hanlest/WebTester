import type { AppView } from "./app-types";

export const NAV_STATUS_HINTS: Record<AppView, string> = {
  session:
    "Vista de sesión: configura la URL y el perfil de dispositivo, inicia o detiene el navegador remoto y ejecuta pruebas con IA.",
  projects:
    "Gestión de proyectos: crea, edita y organiza proyectos junto con sus aplicaciones objetivo y metadatos asociados.",
  settings:
    "Ajustes de la aplicación: conexión a base de datos, exportación e importación de datos y preferencias del entorno.",
  history:
    "Historial de ejecuciones: consulta sesiones y pruebas anteriores con su resultado y contexto guardado.",
  bugs:
    "Seguimiento de incidencias: revisa bugs reportados, capturas y notas vinculadas a las pruebas.",
};

export const WIN95_MENU_STATUS_HINTS = {
  file: "Comandos de archivo: abrir, guardar, imprimir y salir; también accesos a preferencias recientes.",
  edit: "Edición: deshacer, copiar, pegar y buscar dentro del contenido activo de la ventana.",
  view: "Vista: barras de herramientas, panel de estado, iconos grandes y orden de la lista de archivos.",
  help: "Ayuda: temas de ayuda, consejos del día y información sobre Web Tester.",
} as const;

export const WIN95_NAV_FOLDER_HINT =
  "Carpeta Options: agrupa los accesos principales a las secciones de navegación de Web Tester.";
