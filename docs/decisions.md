# Decisiones técnicas — WJ-INFORMATICA

## DT-001 — Motor de base de datos
**Fecha:** 2026-10-28  
**Estado:** Pendiente de confirmación antes de Etapa 3  
**Opciones:** SQLite (node:sqlite nativo, cero dependencias) / MySQL  
**Recomendación:** SQLite si el hosting garantiza persistencia del sistema de archivos  
**Condición de cambio:** Confirmar proveedor de hosting

## DT-002 — Framework de servidor
**Fecha:** 2026-10-28  
**Decisión:** node:http nativo, sin Express  
**Motivo:** El volumen de rutas (8–10) no justifica la dependencia; reduce superficie de ataque y dependencias de mantenimiento  
**Revisión:** Si el número de rutas supera 20 o se requiere middleware complejo

## DT-003 — Hash de contraseñas
**Fecha:** 2026-10-28  
**Decisión:** node:crypto con scrypt  
**Motivo:** Nativo en Node.js, resistente a ataques de fuerza bruta, sin dependencias externas  
**Parámetros:** N=16384, r=8, p=1 (ajustables según pruebas de rendimiento del servidor)

## DT-004 — Tipografía
**Fecha:** 2026-10-28  
**Decisión:** Stack de sistema (-apple-system, system-ui, Segoe UI)  
**Motivo:** Sin solicitudes externas, cero latencia, renderizado nativo del OS  
**Revisión:** Si el cliente requiere fuente específica de marca

## DT-005 — Sistema de temas
**Fecha:** 2026-10-28  
**Decisión:** CSS custom properties + data-theme en html + localStorage  
**Motivo:** Nativo, sin JavaScript en CSS, persistencia en navegador, sin FOUT mediante script inline en head

## DT-006 — Proveedor de hosting
**Estado:** Pendiente — requerida antes de Etapa 6  
**Impacto:** Determina DB_TYPE definitivo, gestión de procesos (PM2 vs systemd vs otro), HTTPS, variables de entorno en producción
