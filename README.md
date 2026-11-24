# CarePredict // Hospital OP Load Predictor

CarePredict is a professional, AI-powered analytical dashboard designed for healthcare administrators to monitor and predict outpatient (OP) loads across various hospital departments. By leveraging historical data and Google Gemini AI, it provides accurate forecasts to help optimize staff allocation and operational efficiency.

![CarePredict Dashboard](https://images.unsplash.com/photo-1504813184591-01592fd03cfd?auto=format&fit=crop&q=80&w=1200)

## 核心功能 // Core Features

- **Operations Overview**: Real-time visualization of monthly visitors, average daily load, and peak intensity.
- **Document Registry**: A secured, searchable table of historical records with validation tracking.
- **AI Predictive Modeling**: Synthetic 7-day load forecasting using Gemini AI (Flash) to identify upcoming surges.
- **Allocation Mapping**: Visual breakdown of visitor distribution across core departments (Pediatrics, General Medicine, etc.).
- **Hyper-Technical HUD**: A professional, dark-mode interface designed for focus and precision, inspired by high-fidelity laboratory equipment.
- **Scanning Line & Grid Logic**: Realistic CRT-style scanning effects and pixel grids to enhance depth and immersion.
- **Terminal Log Integration**: Real-time system event logging for monitoring AI synthesis and data synchronization.
- **Advanced Data Viz**: Custom technical charts using Recharts with monospace fonts and technical annotations.

## 技术栈 // Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Backend & API**: [Express](https://expressjs.com/) (Node.js)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **AI Engine**: [Google Gemini AI SDK](https://ai.google.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Data Viz**: [Recharts](https://recharts.org/)
- **Development Utility**: [Vite](https://vitejs.dev/)

## 快速接入 // Quick Start

### Prerequisites

- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd carepredict
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## 项目结构 // Project Structure

```text
/src
  /components
    /dashboard     # Stat cards, distribution maps
    /layout        # Sidebar, navigation logic
  /lib             # Tailwind utilities (cn helper)
  /services        # AI Prediction logic (Gemini integration)
  /types.ts        # Shared TypeScript interfaces
  App.tsx          # Main view routing and state management
/server.ts         # Express server & Mock Data API
```

## 开发者视角 // Developer Notes

CarePredict uses a **Full-Stack Vite** architecture. The Express server handles API requests and serves the Vite application as middleware during development. In production, it serves static files from the `dist/` directory.

The AI forecasting module (`predictService.ts`) uses a "Zero-Trust" approach to data, sending sanitized historical windows to the LLM for trend synthesis.

---

*Developed as a high-performance clinical tool for hospital management optimization.*
