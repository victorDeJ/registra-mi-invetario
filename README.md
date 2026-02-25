# 🔧 Registra mi Inventario

Sistema de gestión de inventario para ferreterías, desarrollado con Angular 21, Angular Material, Capacitor y Firebase.

---

## 🚀 Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 21 | Framework principal |
| Angular Material | 21 | Componentes UI |
| Capacitor | 7 | Compilación Android |
| Firebase / Firestore | 11 | Base de datos en tiempo real |

---

## 📋 Funcionalidades

- ✅ Listar todos los productos del inventario
- ✅ Agregar nuevos productos
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Búsqueda en tiempo real por nombre, marca o descripción
- ✅ Cálculo automático de margen de ganancia
- ✅ Sincronización en tiempo real con Firebase Firestore
- ✅ Aplicación compilable para Android

### Propiedades de cada producto

| Campo | Tipo | Requerido |
|---|---|---|
| ID | string (auto) | Sí |
| Nombre | string | Sí |
| Descripción | string | No |
| Marca | string | No |
| Costo | number | No |
| Precio de venta | number | No |

---

## ⚙️ Configuración Firebase

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Cloud Firestore** en modo de prueba (o producción)
4. Ve a **Configuración del proyecto** > **Tus apps** > Agrega una app web
5. Copia las credenciales

### 2. Configurar credenciales en la app

Abre el archivo `src/environments/environment.ts` y reemplaza con tus credenciales:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_PROJECT.firebaseapp.com',
    projectId: 'TU_PROJECT_ID',
    storageBucket: 'TU_PROJECT.appspot.com',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID'
  }
};
```

Haz lo mismo en `src/environments/environment.prod.ts` para producción.

### 3. Reglas de Firestore (desarrollo)

En Firebase Console > Firestore > Reglas:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run start
# o
npx ng serve
```

Abre `http://localhost:4200` en el navegador.

---

## 📱 Compilar para Android

### Prerequisitos
- Android Studio instalado
- Java JDK 17+
- Variables de entorno `ANDROID_HOME` y `JAVA_HOME` configuradas

### Pasos de compilación

```bash
# 1. Compilar la app Angular
npm run build

# 2. Sincronizar con Capacitor
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

En Android Studio:
- Click en **Build > Generate Signed APK** para generar un APK firmado
- O presiona **Run** para correr en un emulador/dispositivo

### Script rápido de build + sync

```bash
npm run build && npx cap sync android
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── product-dialog/      # Diálogo agregar/editar producto
│   │   └── confirm-dialog/      # Diálogo confirmación de borrado
│   ├── models/
│   │   └── product.model.ts     # Interface Product
│   ├── pages/
│   │   └── inventory/           # Página principal de inventario
│   ├── services/
│   │   └── product.service.ts   # Servicio CRUD Firebase
│   ├── app.config.ts            # Configuración providers (Firebase, etc.)
│   └── app.routes.ts            # Rutas de la app
├── environments/
│   ├── environment.ts           # ⚠️ Poner credenciales Firebase aquí
│   └── environment.prod.ts
└── styles.scss                  # Estilos globales
```

---

## 📄 Licencia

MIT
