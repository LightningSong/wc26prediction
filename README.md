# FIFA World Cup 2026 — Simulador & Predicciones Estocásticas

Este es un proyecto híbrido moderno para simular y predecir los resultados de la **Copa del Mundo FIFA 2026**. Combina una interfaz interactiva de alto rendimiento en **Next.js (React)** con un motor matemático y scraper en **Python (Flask)**.

---

## 🚀 Características Principales

1. **Algoritmo de Predicción y Motor Matemático**:
   *   **Web Scraping & Historial Reciente**: Extrae automáticamente los últimos 12 partidos oficiales de cada selección de la FIFA.
   *   **Decaimiento Temporal**: Aplica un factor de ponderación exponencial para que los partidos más recientes tengan mayor peso en la proyección que los encuentros más antiguos.
   *   **Anclaje de Ranking FIFA**: Cruza los puntos y la posición del ranking oficial de la FIFA de cada selección (ej. México 1681 pts, Sudáfrica 1430 pts) para modelar la fuerza relativa inicial.
   *   **Ventaja Histórica (Head-to-Head)**: Analiza el historial histórico de enfrentamientos entre ambos rivales para identificar y ponderar ventajas históricas de juego.
   *   **Expectativa de Goles (xG)**: Genera la proyección y expectativa de goles esperados de cada selección para el encuentro.
   *   **Corrección de Marcadores Bajos**: Aplica una calibración matemática que incrementa la probabilidad de marcadores cerrados y empates de bajas anotaciones, reflejando el comportamiento real de los torneos de fútbol de alta tensión.
   *   **Matriz de Goles y Top 10 Escenarios**: Construye una matriz de probabilidades de goles del equipo local ($y$) vs visita ($x$) y resalta visualmente los 10 marcadores exactos más probables.
   *   **Simulaciones Poisson de Partidos**: Realiza **100,000 simulaciones estocásticas** de cada enfrentamiento individual para resolver la probabilidad porcentual exacta (Victoria Local + Victoria Visitante + Empate = 100%).

2. **Carrusel Dinámico (Top Match Ticker)**:
   *   Muestra en tiempo real los resultados de la Copa del Mundo 2026 directamente de los datos reales jugados y guardados de Wikipedia.

3. **Fase de Grupos en 3 Columnas**:
   *   Visualiza las tablas de posiciones dinámicas en tiempo real.
   *   Lista detallada de partidos por grupo.
   *   **Análisis Predictivo Integrado**: Al hacer clic en un partido, carga a la derecha el panel predictivo con las 100,000 simulaciones de Poisson, matriz de goles y la predicción de Poisson.

4. **Simulación de Simulaciones (Monte Carlo)**:
   *   Ejecuta 250 simulaciones completas del torneo de extremo a extremo en el backend.
   *   Ofrece probabilidades Monte Carlo agregadas para clasificar a Semifinales, Final y coronarse Campeón.

5. **Fase Final (Playoffs)**:
   *   Árbol interactivo del torneo con opciones de pantalla completa para simular manualmente la fase de eliminación directa.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: Next.js 15, React, Tailwind CSS, TypeScript.
*   **Backend**: Python 3, Flask, Flask-CORS.
*   **Scraping y Datos**: BeautifulSoup4 (bs4), Requests.
*   **Cálculo Estocástico**: Distribución de Poisson y Simulaciones Monte Carlo.

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu equipo:
*   [Node.js](https://nodejs.org/) (versión 18 o superior)
*   [Python 3.x](https://www.python.org/) y `pip`

---

## 💻 Instrucciones de Instalación y Ejecución

### Opción Rápida (PowerShell en Windows)
Si estás en Windows, puedes iniciar ambos servidores (Backend + Frontend) ejecutando nuestro script automatizado:
```powershell
./dev.ps1
```

---

### Opción Manual

#### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd wc26prediction
```

#### 2. Iniciar el Backend (Python Flask)
1. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecuta el servidor Flask (correrá en el puerto `8000`):
   ```bash
   python api/index.py
   ```

#### 3. Iniciar el Frontend (Next.js)
1. Abre una nueva terminal en la raíz del proyecto e instala las dependencias de Node:
   ```bash
   npm install
   ```
2. Ejecuta el servidor de desarrollo (correrá en `http://localhost:3000`):
   ```bash
   npm run dev
   ```

---

## 📁 Estructura del Proyecto

*   `api/`: Servidor backend de Flask.
    *   `api/scraper.py`: Lógica del scraper web en tiempo real de resultados de Wikipedia.
    *   `api/features/`: Módulos de simulación, cálculo de Poisson y enrutamientos.
    *   `api/core/`: Datos históricos de rendimiento de selecciones nacionales.
*   `src/`: Aplicación frontend en Next.js.
    *   `src/app/`: Rutas, estructura base e importación de estilos globales.
    *   `src/features/`: Vistas de Grupos, Fase Final y Predicciones Monte Carlo.
    *   `src/hooks/`: Hook `useTournament.ts` para persistencia local y llamadas al backend.
