# 🌸 ERP Vitora - Sistema de Gestión para Florería

Sistema ERP completo para gestión de florería, incluyendo punto de venta, gestión de empleados, control de asistencia con GPS, y sistema de delivery.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## ✨ Características

### 📦 Punto de Venta (POS)
- Catálogo de productos con categorías
- Carrito de compras
- Múltiples métodos de pago
- Generación de tickets
- Historial de ventas

### 👥 Gestión de Personal
- Registro de empleados
- Roles: Superadmin, Admin, Vendedor, Florista, Repartidor
- Creación de cuentas de usuario vinculadas

### ⏰ Control de Asistencia
- Marcado de entrada/salida
- Verificación GPS del lugar de trabajo
- Control de breaks
- Notificaciones por Telegram
- Historial de asistencia

### 🚚 Sistema de Delivery
- Gestión de pedidos de entrega
- Mapa con ubicaciones
- Estado de pedidos en tiempo real
- Asignación de repartidores

### 📊 Dashboard y Reportes
- Estadísticas de ventas
- Métricas de rendimiento
- Calendario de eventos

## 🚀 Instalación

### Prerrequisitos
- Node.js 22.x
- Cuenta en Supabase
- (Opcional) Bot de Telegram para notificaciones

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/erp-vitora.git
cd erp-vitora
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```
Edita `.env.local` con tus credenciales de Supabase y Telegram.

4. **Configurar base de datos**
Ejecuta los scripts SQL en tu proyecto de Supabase (ubicados en `src/scripts/`).

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🌐 Despliegue en Heroku

1. **Crear app en Heroku**
```bash
heroku create tu-app-vitora
```

2. **Configurar variables de entorno**
```bash
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
heroku config:set TELEGRAM_BOT_TOKEN=tu-bot-token
heroku config:set TELEGRAM_CHAT_ID=tu-chat-id
```

3. **Desplegar**
```bash
git push heroku main
```

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Superadmin** | Acceso total al sistema |
| **Admin** | Gestión de personal, productos, configuración |
| **Vendedor** | POS, marcar asistencia, ver sus ventas |
| **Florista** | Marcar asistencia, ver pedidos |
| **Repartidor** | Marcar asistencia, gestionar entregas |

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4, shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Notificaciones**: Telegram Bot API
- **Mapas**: Google Maps API

## 📝 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (para admin) |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | ID del chat para notificaciones |

---

Desarrollado con 💖 para Florería Vitora

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
