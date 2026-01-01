# Sellshot AI

An AI-powered platform that helps small business owners transform basic product photos into professional studio-quality images through intelligent prompt refinement and image generation.

Powered by Google Gemini models (Gemini 2.5 Pro, Gemini 2.5 Flash, Imagen).

## Features

- **Product Photo Transformation**: Upload your product photos and use AI to place them in professional studio settings.
- **AI Suggestions**: Automatically get prompt suggestions based on your uploaded image content.
- **Image Generation**: Create photorealistic product mockups from scratch using text prompts.
- **Refinement Tools**: Fine-tune your results with natural language commands.
- **Gallery Management**: View, download, and manage your creations.
- **Comparison View**: Compare original vs. edited images side-by-side.
- **Mock Authentication**: Demo login system.
- **Freemium Model**: Credits system (demo) with upgrade flows.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK
- **Components**: `react-compare-image`

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Cloud Project with the Gemini API enabled
- An API Key from Google AI Studio

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sellshot-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your Google API key:
   ```env
   API_KEY=your_google_api_key_here
   ```
   > **Note:** The application expects the variable to be named `API_KEY`, as seen in `services/geminiService.ts`.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).

## Project Structure

- **`App.tsx`**: Main application logic, state management, and routing (tabs).
- **`services/geminiService.ts`**: Handles interactions with the Google GenAI SDK (analysis, editing, generation).
- **`components/`**: UI components including Auth, Icons, and Landing Page.
- **`types.ts`**: TypeScript definitions.

## Credits

Powered by Google Gemini.
