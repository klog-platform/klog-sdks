# Ejemplo browser (Vite + proxy)

El navegador **no** debe llevar el API token en producción. Este ejemplo usa el proxy de Vite:

1. Copia `.env.example` a `.env` en esta carpeta y rellena `KLOG_*`.
2. Desde el workspace `sdk/`: `npm run build`.
3. Aquí: `npm install` y `npm run dev`.
4. Abre `http://localhost:5199` y pulsa **Enviar evento info**.

Las peticiones van a `/api/ingest` (same-origin); Vite añade `Authorization` y reescribe la ruta hacia la API.
