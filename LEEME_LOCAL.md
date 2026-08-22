# 🎙️ Estudio de Locución y Narración con IA

Aplicación completa lista para ejecutarse localmente en tu computadora (Windows, Mac o Linux) con conexión a Internet.

---

## 🚀 Inicio Rápido (1 Clic)

### En Windows:
1. Asegúrate de tener instalado [Node.js (versión 18 o superior)](https://nodejs.org/).
2. Haz doble clic en el archivo **`iniciar_app.bat`**.
3. El instalador descargará automáticamente los módulos, compilará la app y abrirá tu navegador en `http://localhost:3000`.

### En Mac o Linux:
1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   chmod +x iniciar_app.sh
   ./iniciar_app.sh
   ```
3. Tu navegador se abrirá en `http://localhost:3000`.

---

## 🛠️ Ejecución Manual con Comandos

Si prefieres usar la consola directamente:

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar la aplicación
npm run build

# 3. Iniciar el servidor
npm start
```

Luego abre tu navegador en **`http://localhost:3000`**.

---

## 🔑 Claves API y Conectividad

- La aplicación funciona inmediatamente sin necesidad de configuración inicial.
- **Motor Gratuito Ilimitado (Edge Neural + Web TTS)**: Funciona siempre al 100% sin requerir claves API ni incurrir en costos (con voces masculinas y femeninas).
- **Google Gemini / OpenAI / Groq / ElevenLabs**: Puedes ingresar tu propia clave API directamente desde el botón **"Clave API"** en la interfaz superior de la aplicación para activar Gemini 3.1 Flash TTS HD o cualquiera de los proveedores soportados. Las claves se guardan de forma local y segura en tu navegador.
