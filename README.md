# rutapp — Frontend

Aplicación web de **gestión de rutas y entregas**. SPA construida con **React + TypeScript + Vite**,
con autenticación JWT por roles (`admin` / `chofer`).

Este front puede correr **con un backend real** o **con un mock en memoria** (sin backend),
ideal para desarrollar y demostrar la UI mientras la API todavía no está disponible.

---

## Stack

| Capa            | Tecnología                           |
| --------------- | ------------------------------------ |
| Build / dev     | Vite                                 |
| UI              | React + TypeScript                   |
| Estilos         | Tailwind CSS v4 (tokens en `@theme`) |
| Estado servidor | React Query (TanStack Query)         |
| Estado auth     | Zustand (con persistencia)           |
| HTTP            | Axios (interceptor JWT)              |
| Routing         | React Router                         |

---

## Requisitos

- **Node.js 20+** y npm.

> En la máquina corporativa donde se desarrolla, Node está instalado en scope de usuario y
> **no queda en el PATH de las terminales nuevas** hasta reiniciar VS Code. Si `node`/`npm`
> "no se reconocen", agregalo a la sesión actual de PowerShell:
>
> ```powershell
> $env:Path += ";$env:LOCALAPPDATA\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.16.0-win-x64"
> ```

---

## Cómo arrancar

```powershell
npm install      # solo la primera vez
npm run dev      # servidor de desarrollo -> http://localhost:5173
npm run build    # build de producción (valida tipos + compila)
npm run preview  # sirve el build de producción localmente
```

---

## Usuarios de prueba (modo mock)

| Rol    | Email               | Contraseña  |
| ------ | ------------------- | ----------- |
| Admin  | `admin@rutapp.com`  | `admin123`  |
| Chofer | `chofer@rutapp.com` | `chofer123` |

En el login hay un selector **Admin / Chofer**: elegí el rol que coincide con el usuario.

---

## El MOCK (backend simulado)

Cuando no hay API real, la app usa un **adaptador de Axios** que responde los endpoints en memoria.
La gracia es que **ningún componente ni hook sabe que el backend es falso**: todos llaman a
`apiClient` normalmente. El mock se enchufa a nivel de transporte HTTP.

### ¿Cómo se activa?

Mediante la variable de entorno en `.env.development`:

```env
VITE_USE_MOCK=true
```

Si la app arranca con el mock activo, vas a verlo funcionando **como si ya existiera un admin
creado**: podés loguearte directamente con los usuarios de prueba de arriba.

### Estructura del mock (`src/mocks/`)

| Archivo           | Qué resuelve                                                   |
| ----------------- | ------------------------------------------------------------- |
| `mockAdapter.ts`  | Punto de entrada: enruta cada request al handler correcto.    |
| `mockUsers.ts`    | Usuarios semilla + soporte de login/setup.                    |
| `mockClientes.ts` | CRUD de clientes (3 clientes de ejemplo).                     |
| `mockEntregas.ts` | CRUD de entregas + cancelar/completar (3 entregas de ejemplo). |
| `mockHelpers.ts`  | Utilidades: latencia simulada, respuestas, parseo de body.    |

> Los datos viven **en memoria**: si recargás la página, vuelven al estado semilla.
> (La sesión del usuario sí se conserva en `localStorage`.)

### Probar la pantalla de configuración inicial (`/setup`)

El endpoint `POST /auth/setup` crea el **primer administrador** y solo funciona si el sistema
**no tiene ningún usuario** (si ya hay uno, responde `403` para siempre).

Como el mock arranca con usuarios semilla, por defecto `/setup` responde `403`
("El sistema ya fue configurado") — que es justo el comportamiento real.

Para probar el **camino feliz** (sistema recién instalado, sin admin), poné en `.env.development`:

```env
VITE_MOCK_SIN_ADMIN=true
```

Con ese flag el mock arranca **sin usuarios**: entrás a `/setup`, creás el primer admin y después
podés loguearte con esas credenciales. Para volver al modo normal, dejá el flag en `false`
(o borralo) y reiniciá `npm run dev`.

> Cambiar variables de entorno requiere **reiniciar el servidor de desarrollo**.

---

## Cómo APAGAR el mock (conectar el backend real)

1. En `.env.development` poné:

   ```env
   VITE_USE_MOCK=false
   ```

   (Vite ya hace proxy de `/api/v1` hacia `http://localhost:8000` — ajustá el target en
   `vite.config.ts` si el backend corre en otro puerto.)

2. *(Opcional, para limpieza definitiva)* podés borrar:
   - la carpeta `src/mocks/` completa,
   - el bloque `if (env.useMock) { ... }` de `src/lib/apiClient.ts`,
   - las variables `VITE_USE_MOCK` y `VITE_MOCK_SIN_ADMIN` de los `.env`.

No hace falta tocar ningún componente: el resto del código ya habla con la API real.

---

## Estructura del proyecto

```
src/
  components/
    layout/        AppShell (header + logout)
    ui/            Button, Input, Select, Badge, Card, Modal, Spinner, EmptyState, Logo
  config/          env.ts (lee variables de entorno)
  features/
    auth/          login, setup (primer admin), hooks de auth
    clientes/      ABM de clientes (api, pages, components)
    entregas/      ABM de entregas (api, pages, components)
  lib/             apiClient (axios + JWT), cn, useDebounce
  mocks/           backend simulado (ver sección arriba)
  pages/           dashboards (admin / chofer)
  routes/          ProtectedRoute (guard por rol)
  store/           authStore (Zustand)
  types/           api.ts (tipos del contrato)
```

---

## Funcionalidades (Sprint 1)

- **Login** con selector de rol y persistencia de sesión.
- **Configuración inicial** (`/setup`): creación del primer administrador.
- **Clientes (ABM)**: listado con búsqueda y paginado, alta, detalle, edición y baja lógica.
  Cada cliente admite hasta 3 direcciones (una principal).
- **Entregas (ABM)**: listado con filtros (estado, cliente, rango de fechas, búsqueda) y paginado,
  alta/edición (con dirección dependiente del cliente), detalle y acciones de
  **completar** / **cancelar**.