# Decisiones técnicas — WJ-INFORMATICA

## DT-001 — Motor de base de datos
**Fecha:** 2026-10-28  
**Estado:** CONFIRMADO — SQLite  
**Decisión:** SQLite con `node:sqlite` nativo (Node.js ≥ 22)  
**Motivo:** Cero dependencias, persistencia en archivo, WAL habilitado, suficiente para el volumen previsto  
**Revisión:** Migrar a MySQL si el hosting no garantiza escritura en disco o si la concurrencia lo exige  

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

---

## Procedimiento de respaldo — SQLite

**Archivo de base de datos:** `backend/database/wj.db`

### Respaldo manual
```bash
# Copia segura usando la API de SQLite (preserva integridad con WAL)
node -e "
import('node:sqlite').then(({ DatabaseSync }) => {
  const db = new DatabaseSync('backend/database/wj.db');
  db.exec(\"VACUUM INTO 'backend/database/wj.backup-\" + new Date().toISOString().slice(0,10) + \".db'\");
  db.close();
  console.log('Respaldo completado.');
});
"
```

### Respaldo de emergencia (copia directa)
Solo cuando el servidor esté detenido y no haya transacciones activas:
```bash
cp backend/database/wj.db backend/database/wj.backup-$(date +%Y%m%d).db
```

### Recuperación
```bash
# Detener el servidor antes de restaurar
cp backend/database/wj.backup-YYYYMMDD.db backend/database/wj.db
```

### Política de retención
- Conservar al menos los últimos 7 respaldos diarios.
- Los archivos `.db`, `.db-shm` y `.db-wal` están excluidos del repositorio por `.gitignore`.
- En producción, el respaldo deberá automatizarse según las capacidades del alojamiento (cron, tarea programada o servicio del hosting).

### Exposición accidental de credenciales
Si un secreto es publicado accidentalmente en el repositorio o en un log:
1. Rotar la credencial de inmediato (generar nueva, invalidar la anterior).
2. Eliminar el commit o limpiar el historial con `git filter-repo` si corresponde.
3. Notificar a los servicios afectados.
4. Eliminar el secreto de cualquier log o caché accesible.
