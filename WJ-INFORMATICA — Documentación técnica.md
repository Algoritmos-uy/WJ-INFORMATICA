# 

# WJ-INFORMATICA — Documentación técnica

Sitio web profesional con backend, persistencia SQLite y panel de administración privado. Desarrollado en 6 etapas, desplegado en producción en algoritmos.uy.

## Stack y decisiones clave

| Capa | Tecnología | Razón |
| --- | --- | --- |
| Runtime | Node.js v24+ | node:sqlite disponible desde v22; engines declarado en package.json |
| Servidor HTTP | node:http nativo | Sin Express — el volumen de rutas (8–10) no justifica la dependencia |
| Base de datos | node:sqlite (SQLite) | Cero dependencias, persistencia en archivo, WAL habilitado |
| Criptografía | node:crypto — scrypt | Nativo, resistente a fuerza bruta, sin paquetes externos |
| Tipografía | Stack de sistema | Sin solicitudes externas, cero latencia |
| Temas | CSS custom properties + data-theme | Sin JavaScript en CSS, anti-FOUT mediante script inline en head |
| Tests | node:test | Nativo desde v18, sin Jest ni Mocha |

**Cero dependencias npm.** No existe node\_modules ni package-lock.json. El servidor arranca con `node backend/server.js`.

## Estructura de directorios

```
wj-informatica/
├── admin/                  Panel de administración (SPA privada)
│   ├── index.html
├── js/
│       └── admin.js
│   └── css/
│       └── admin.css
├── backend/
│   ├── config/
│   │   └── env.js              Carga .env; getters para ADMIN_* (evita caché ESM)
│   ├── controllers/
│   │   ├── authController.js   Login/logout con scrypt + cookie HttpOnly
│   │   └── contactController.js
│   ├── database/
│   │   └── db.js               initDb(overridePath), closeDb(); migrations al vuelo
│   ├── middleware/
│   │   ├── auth.js             requireAuth — devuelve sesión o 401
│   │   ├── rateLimit.js        In-memory, separado por ruta; resetRateLimitStore() para tests
│   │   └── static.js           serveStatic + serveAdmin; protección path traversal con path.sep
│   ├── routes/
│   │   ├── admin.js            GET /contacts, POST /login, POST /logout, PATCH/:id, DELETE/:id
│   │   └── contact.js
│   ├── scripts/
│   │   └── hash-password.js    Generador interactivo de ADMIN_PASSWORD_HASH
│   ├── services/
│   │   ├── contactService.js   validateContact, saveContact, getContacts, updateEstado, deleteContact
│   │   ├── logger.js           JSON estructurado; redacta password/token/secret
│   │   └── sessionService.js   createSession, getSession, deleteSession, cleanExpiredSessions
│   ├── utils/
│   │   └── http.js             json(), parseBody(), parseCookies(), getIp()
│   └── server.js
├── docs/
│   └── decisions.md        DT-001 a DT-006 + procedimiento de respaldo SQLite
├── public/               Sitio público estático
│   ├── index.html
│   ├── contacto.html
│   ├── soluciones.html
│   ├── portfolio.html
│   ├── sobre-mi.html
│   ├── css/
│   ├── js/
│   └── assets/
├── tests/
│   ├── contact.test.js     15 tests (8 unitarios + 7 HTTP)
│   └── admin.test.js       15 tests (auth + rutas protegidas + operaciones CRUD)
├── .env                    NO commitear — excluido en .gitignore
└── package.json
```

## Variables de entorno (.env)

| Variable | Requerida en prod | Descripción |
| --- | --- | --- |
| NODE\_ENV | Sí | `production` en servidor |
| PORT | No | Puerto HTTP (default 3000; en cPanel lo asigna Passenger) |
| DB\_PATH | No | Ruta a wj.db (default `backend/database/wj.db` relativo a cwd) |
| SESSION\_SECRET | Sí | Cadena aleatoria larga; el servidor aborta si falta en producción |
| ADMIN\_USERNAME | Sí | Nombre de usuario del panel admin |
| ADMIN\_PASSWORD\_HASH | Sí | Formato `salt:hash` generado con `npm run hash-password` |

## Comandos

```bash
npm start              # Inicia el servidor (producción)
npm run dev            # Inicia con --watch (desarrollo)
npm test               # Ejecuta los 30 tests
npm run hash-password  # Genera ADMIN_PASSWORD_HASH interactivamente
```

## Rutas HTTP

### Públicas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET/HEAD | /\* | Archivos estáticos de public/ |
| POST | /api/contact | Enviar consulta (rate limit: 3/15min por IP) |

### Panel admin

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | /admin/ | No | SPA del panel |
| GET | /admin/css/\* /admin/js/\* | No | Assets del panel |
| POST | /admin/api/login | No | Login (rate limit: 5/15min por IP) |
| POST | /admin/api/logout | Sí | Logout |
| GET | /admin/api/contacts | Sí | Listar consultas |
| PATCH | /admin/api/contacts/:id | Sí | Cambiar estado (pendiente/leida/atendida) |
| DELETE | /admin/api/contacts/:id | Sí | Eliminar consulta |

## Seguridad

- **Contraseñas:** scrypt (N=16384, r=8, p=1) + comparación timing-safe
- **Sesiones:** token de 64 hex chars (32 bytes aleatorios), 8h de vida, almacenadas en SQLite
- **Cookie:** `HttpOnly; SameSite=Strict; Path=/admin; Max-Age=28800` + `Secure` en producción
- **CSRF:** SameSite=Strict + API solo JSON (sin vectores de form submission)
- **Path traversal:** protección con `path.sep` (compatible Linux/Windows)
- **Rate limiting:** in-memory por IP, instancias separadas para /api/contact y /admin/api/login
- **Logs:** redacta automáticamente password, token, secret, session, cookie, authorization
- **Admin:** `<meta name="robots" content="noindex, nofollow">`; no indexado

## Despliegue en producción (cPanel/CloudLinux)

**Proveedor:** Hosting compartido con cPanel + Phusion Passenger **Dominio:** algoritmos.uy **Node.js:** v24 vía nvm gestionado por cPanel

### Configuración Passenger (.htaccess en la raíz de la app)

```apache
PassengerAppRoot "/home/wuenhtvnbq/algoritmos.uy"
PassengerNodejs "/home/wuenhtvnbq/nodevenv/algoritmos.uy/backend/24/bin/node"
PassengerAppType node
PassengerStartupFile backend/server.js
```

**Importante:** `PassengerAppRoot` debe apuntar a la raíz del proyecto (no a `backend/`). Si apunta a `backend/`, `process.cwd()` es incorrecto y el servidor no encuentra `public/`, `admin/` ni el archivo `.env`.

### Variables de entorno

Configuradas desde "Setup Node.js App" → Environment Variables en cPanel (no en archivo .env en producción).

### Sin `npm install`

El proyecto tiene cero dependencias npm. No se necesita correr `npm install` en el servidor.

## Base de datos

**Motor:** SQLite v3 vía node:sqlite nativo **Archivo:** `backend/database/wj.db` (excluido de git) **WAL:** habilitado (`PRAGMA journal_mode = WAL`) **Foreign keys:** habilitadas

### Tablas

**contacts**

```
id INTEGER PRIMARY KEY AUTOINCREMENT
nombre TEXT NOT NULL
email TEXT NOT NULL
telefono TEXT
mensaje TEXT NOT NULL
ip TEXT
estado TEXT DEFAULT 'pendiente'   -- pendiente | leida | atendida
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**sessions**

```
token TEXT PRIMARY KEY    -- 64 hex chars
expires_at INTEGER        -- Unix timestamp
ip TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Respaldo

```bash
# Copia segura (servidor puede estar corriendo)
node -e "import('node:sqlite').then(({DatabaseSync})=>{
  const db=new DatabaseSync('backend/database/wj.db');
  db.exec(\"VACUUM INTO 'backend/database/wj.backup-\"+new Date().toISOString().slice(0,10)+\".db'\");
  db.close(); console.log('Respaldo completado.');
});"
```

## Etapas del proyecto

| # | Nombre | Estado |
| --- | --- | --- |
| 1 | Auditoría y planificación | ✅ Completada |
| 2 | Frontend público | ✅ Completada |
| 3 | Backend y persistencia | ✅ Completada |
| 4 | Panel de administración | ✅ Completada |
| 5 | Integración y aceptación | ✅ Completada |
| 6 | Despliegue en producción | ✅ Completada |
| 7 | Chatbot DeepSeek | ⏳ Pendiente |

## Bugs resueltos notables

**Path traversal check incompatible con Linux** — `backend/middleware/static.js` usaba `'\\'` (barra Windows) en la verificación de seguridad. En Linux `path.sep` es `/`, lo que causaba 403 en absolutamente todas las rutas al desplegar. Fix: reemplazar `'\\'` por `sep` importado de `node:path`.

**Admin 404 por trailing slash** — Sin `/` final en `/admin`, el browser resolvía las rutas relativas del HTML desde la raíz (`/css/admin.css` en vez de `/admin/css/admin.css`). Fix: redirect 301 de `/admin` a `/admin/` en `server.js`.

**éxito del formulario no se mostraba** — `form.reset()` dispara el evento `reset` que llamaba `clearStatus()`, borrando el mensaje de éxito recién mostrado. Fix: flag `keepStatus` para evitar que el reset programático borre el mensaje.

**Env variables cacheadas en ESM** — `env.js` cacheaba `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH` al momento de importación. Los tests seteaban `process.env` después, por lo que siempre veían string vacío. Fix: getters JavaScript que leen `process.env` en tiempo de ejecución.
