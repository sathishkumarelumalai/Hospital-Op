This contains everything you need to run your app locally.
App Name: CarePredict (Hospital OP Load Predictor)
UI/UX: Custom "clinical" design system with technical grids, font-display (Playfair Display) for branding, and JetBrains Mono for data points.
AI Integration: Powered by Google Gemini to analyze historical visitor trends and project a 7-day forecast.
Backend: Full-stack setup with Express serving as the API and Vite middleware.
Frontend: React 19, Recharts for visual analytics, and Motion for professional route transitions.

View your app in AI Studio: https://ai.studio/apps/89cc9601-5a95-4607-874e-b780b0996636

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
