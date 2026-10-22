# 🏍️ MotoApp - Viajeros

Aplicación móvil multiplataforma diseñada para la comunidad de motociclistas. Permite a los viajeros encontrarse en ruta, coordinar destinos en común, comunicarse mediante chat en tiempo real, compartir su ubicación GPS y promocionar lugares de encuentro (paradores, talleres, estaciones de servicio).

---

## 🛠️ Tecnologías y Stack Utilizado

* **Frontend Móvil:** React Native con **Expo (SDK 57)**
* **Navegación:** React Navigation (Bottom Tabs)
* **Mapas y Geolocalización:** `react-native-maps` y `expo-location` (Google Maps en Android / Apple Maps en iOS)
* **Backend as a Service (BaaS):** **Supabase** (PostgreSQL, Autenticación, Realtime WebSockets, Storage)
* **Validación de Datos:** **Zod**
* **Testing:** **Jest**

---

## ✨ Características Principales

1. **Radar Motero & Mapa en Vivo (`MapScreen`):**
   * Visualización de la ubicación GPS del usuario y de otros motociclistas activos en ruta.
   * Marcadores interactivos de puntos de encuentro promocionados por la comunidad.
2. **Destinos en Común (`TripsScreen`):**
   * Publicación y unión a salidas grupales con fecha, hora y destino.
3. **Chat de Ruta en Tiempo Real (`ChatScreen`):**
   * Sincronización instantánea de mensajes mediante **Supabase Realtime**.
4. **Perfil y Multimedia (`ProfileScreen`):**
   * Gestión de datos del motociclista y modelo de moto.
   * Subida de fotos de perfil directamente a **Supabase Storage**.
5. **Seguridad y Validación:**
   * Esquemas de validación de entradas con Zod.
   * Row-Level Security (RLS) en Supabase para proteger los datos de los usuarios.

---

## 🚀 Guía de Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/appMotos.git
cd appMotos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:
```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Configurar la Base de Datos en Supabase
Ejecuta el script SQL ubicado en `supabase_schema.sql` en el **SQL Editor** de tu proyecto en Supabase para crear las tablas (`profiles`, `trips`, `messages`, `meeting_places`), políticas RLS y triggers automáticos.

### 5. Ejecutar la aplicación
* **Desarrollo Nativo (Recomendado para Mapas en Android):**
  ```bash
  npx expo run:android
  ```
* **Expo Go (Sin mapas nativos personalizados):**
  ```bash
  npx expo start -c
  ```

---

## 🧪 Pruebas (Testing)

Para ejecutar las pruebas unitarias de validación con Jest:
```bash
npm test
```
