# Apoyo Comunicacional para Personas con Capacidades Comunicativas Limitadas

Sistema web de comunicación asistida desarrollado como Proyecto Final de Ingeniería en Sistemas de Información de la Universidad Tecnológica Nacional, Facultad Regional San Francisco.

## Descripción

El proyecto tiene como objetivo facilitar la comunicación y la interacción con el entorno de personas cuyas discapacidades pueden limitar sus capacidades comunicativas.

Para ello, se desarrolló una aplicación web modular que integra diferentes alternativas de comunicación, combinando pictogramas, seguimiento ocular y modelos de inteligencia artificial para el reconocimiento de emociones y letras del abecedario de la Lengua de Señas Argentina (LSA).

## Acceso al proyecto

- **Aplicación web:** [Acceder al sistema](https://proyectofinal-78eb4.web.app/)
- **Código fuente:** [Repositorio en GitHub](https://github.com/Federico-Audizio/ProyectoFinal)

## Funcionalidades

### Pictogramas
Permite seleccionar pictogramas para expresar necesidades, ideas y mensajes sin depender exclusivamente de la comunicación oral o escrita.

### Mis Grillas
Permite crear y personalizar grillas de pictogramas, adaptando su tamaño, distribución y contenido a las necesidades de cada persona usuaria.

### Seguimiento ocular
Permite interactuar con los elementos de la interfaz mediante la dirección de la mirada, ofreciendo una alternativa de interacción para personas con dificultades motrices.

### Reconocimiento de emociones
Integra un modelo de inteligencia artificial orientado al reconocimiento de expresiones emocionales, con el propósito de ampliar las alternativas de comunicación disponibles.

### Lengua de Señas Argentina (LSA)
Incorpora un modelo de reconocimiento de señas orientado a las letras del abecedario de la Lengua de Señas Argentina.

### Alarma de emergencia
Ofrece una funcionalidad para indicar situaciones de urgencia.

### Accesibilidad
Incluye opciones de adaptación visual para facilitar la utilización de las vistas correspondientes a pictogramas y seguimiento ocular.

## Tecnologías utilizadas

Las tecnologías utilizadas en el desarrollo incluyen:

- **Frontend:** React, Vite, JavaScript, TypeScript, HTML y CSS.
- **Backend:** Python y Flask.
- **Procesamiento de imágenes e inteligencia artificial:** OpenCV, MediaPipe, TensorFlow/Keras y herramientas de aprendizaje automático.
- **Infraestructura y herramientas:** Docker, Firebase y Git.

## Arquitectura

La aplicación está organizada en módulos que permiten separar las funcionalidades de la interfaz y los procesos de reconocimiento.

- **Frontend:** presenta la interfaz y gestiona las interacciones de la persona usuaria.
- **Backend:** proporciona servicios mediante Flask para ejecutar los procesos de reconocimiento.
- **Modelos de inteligencia artificial:** procesan la información capturada para realizar tareas específicas, como el reconocimiento de emociones y letras de LSA.

Esta organización facilita el desarrollo, la integración y las pruebas de cada módulo.

## Ejecución local

Para ejecutar el proyecto en un entorno local, es necesario instalar las dependencias correspondientes al frontend y al backend.

### Requisitos

- Node.js y npm, en versiones compatibles con el proyecto.
- Python, en una versión compatible con las dependencias del backend.
- Git.
- Los archivos de los modelos y las dependencias adicionales que requiera cada módulo.

### 1. Clonar el repositorio

```bash
git clone https://github.com/Federico-Audizio/ProyectoFinal.git
cd ProyectoFinal
```

### 2. Iniciar el frontend

Ingresar a la carpeta que contiene el frontend e instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

### 3. Iniciar el backend

Ingresar a la carpeta donde se encuentra `app.py` y crear un entorno virtual:

```bash
python -m venv venv
```

En Windows, activar el entorno virtual:

```bash
venv\Scripts\activate
```

Instalar las dependencias, si el repositorio incluye un archivo `requirements.txt`:

```bash
pip install -r requirements.txt
```

Ejecutar el backend, si `app.py` está configurado para iniciarse directamente:

```bash
python app.py
```

**Nota:** las rutas de las carpetas, los archivos de dependencias y los comandos de ejecución deben ajustarse a la estructura definitiva del repositorio. El frontend también debe estar configurado para comunicarse con la dirección local del backend.

## Limitaciones conocidas

Los módulos de reconocimiento presentan limitaciones relacionadas con los datos de entrenamiento y las condiciones de utilización.

- **Reconocimiento de emociones:** la precisión puede variar según la intensidad de las expresiones faciales y las características de cada persona.
- **Reconocimiento de LSA:** el alcance actual se concentra en las letras del abecedario y puede presentar dificultades con determinadas señas o movimientos rápidos.
- **Seguimiento ocular:** los cambios importantes en la posición de la persona frente a la cámara pueden afectar la precisión de la interacción.

Estas limitaciones representan oportunidades de mejora para futuras versiones.

## Mejoras futuras

- Ampliar y diversificar los conjuntos de datos de entrenamiento.
- Mejorar la precisión y robustez de los modelos de inteligencia artificial.
- Optimizar la calibración y estabilidad del seguimiento ocular.
- Incorporar nuevas alternativas de comunicación y personalización.
- Realizar nuevas pruebas con personas usuarias y profesionales especializados.

## Autoría

**Federico Audizio, Cristian Nuñez**  
Carrera de Ingeniería en Sistemas de Información  
Universidad Tecnológica Nacional — Facultad Regional San Francisco

Proyecto desarrollado con fines académicos como trabajo final de carrera.

