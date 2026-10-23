# Ejemplo browser (Vite + proxy)

El navegador **no** debe llevar el API token en producción. Este ejemplo usa el proxy de Vite hacia `/klog-proxy`.

1. Copia `.env.example` a `.env` en esta carpeta y rellena `KLOG_*`.
2. Desde la raíz del monorepo `klog-sdks`: `npm install && npm run build -w @kriverdevice/klog-web` (o `npx turbo run build --filter=@kriverdevice/klog-web`).
3. Aquí: `npm install` y `npm run dev`.
4. Abre `http://localhost:5199` y pulsa **Enviar evento info**.

Las peticiones van a `/klog-proxy` (same-origin); Vite añade `Authorization` y reescribe hacia la API de kLog (`KLOG_URL`, por defecto `https://klog-api.krisskira.com` o local `http://localhost:3100`).
