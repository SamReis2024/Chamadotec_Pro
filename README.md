<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jajWX2utyr4f34xg4xB6S6osjrJey7eL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:  
   `npm install`
2. Configure the environment variables in `.env.local` (create the file if it does not exist):
   ```env
   VITE_SUPABASE_URL=coloque_aqui_a_url_do_seu_projeto
   VITE_SUPABASE_ANON_KEY=coloque_aqui_a_chave_anon
   GEMINI_API_KEY=sua_chave_gemini_opcional
   ```
3. Execute o projeto:  
   `npm run dev`
