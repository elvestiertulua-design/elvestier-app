# Guía de Configuración: Acceso Remoto con Ngrok para El Vestier

Para acceder a la aplicación desde dispositivos móviles fuera de la red local Wi-Fi:

## Paso 1: Descargar e Instalar Ngrok
1. Descarga Ngrok para Windows desde: [https://ngrok.com/download](https://ngrok.com/download)
2. Descomprime el ejecutable `ngrok.exe` en tu computadora.

## Paso 2: Autenticar Ngrok
Abre la consola de comandos en la carpeta de ngrok e ingresa tu token:
```bash
ngrok config add-authtoken <TU_AUTHTOKEN>
```

## Paso 3: Iniciar el servidor local y el túnel
1. En esta carpeta (`C:\Users\USUARIO\Desktop\antigravity`), ejecuta el servidor local:
   ```bash
   npm run dev
   ```
2. En otra ventana de comandos, inicia el túnel apuntando al puerto 3000:
   ```bash
   ngrok http 3000
   ```
3. Copia el enlace público `https://xxxx.ngrok-free.app` e ingresa desde cualquier teléfono móvil o computadora.
