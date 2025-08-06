# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
📖 Instrucciones para levantar el proyecto
1️⃣ Clonar el repositorio
Abrir PowerShell o CMD:

powershell
Copiar
Editar
git clone https://github.com/tu-usuario/ProyectoFinal.git
cd ProyectoFinal
2️⃣ Instalar Docker
Descargar Docker Desktop.

Instalarlo y reiniciar la PC.

Verificar instalación:

powershell
Copiar
Editar
docker --version
docker compose version
3️⃣ Configurar VS Code
Abrir Visual Studio Code → File → Open Folder → seleccionar la carpeta del proyecto (ProyectoFinal).

Instalar extensiones recomendadas:

Docker (icono de ballena)

Dev Containers

React Tools

4️⃣ Levantar el contenedor
En la raíz del proyecto, ejecutar:

powershell
Copiar
Editar
docker compose up
👉 La primera vez puede tardar porque instala dependencias.

5️⃣ Abrir la aplicación
Cuando Docker muestre que el servidor está corriendo, abrir:

arduino
Copiar
Editar
http://localhost:5173
(Aparecerá la app React y pedirá permisos para la cámara).

6️⃣ Detener la aplicación
En la terminal:

powershell
Copiar
Editar
docker compose down
🔹 Notas importantes
Si falla por puerto ocupado, ejecutar:

powershell
Copiar
Editar
docker ps
docker stop <CONTAINER_ID>
docker rm <CONTAINER_ID>
Si hay errores de dependencias, correr:

powershell
Copiar
Editar
docker compose build
docker compose up
Los cambios en el código se actualizan automáticamente (Hot Reload).
