<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/658cfc17-b57f-49ed-afa5-1bcf6a9ad5bf

## Run Locally

**Prerequisites:** Node.js and .NET SDK 9


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
4. In another terminal, run the Windows desktop helper:
   `npm run helper:dev`

The helper captures desktop click, scroll, and typing events locally at `http://127.0.0.1:55231`. It does not store typed characters.
