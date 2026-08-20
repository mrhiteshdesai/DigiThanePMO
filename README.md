# DigiThane Development PMO

Public consortium board (status only). **Not** the DigiThane application source.

GitHub: https://github.com/mrhiteshdesai/DigiThanePMO

Working copy of the municipal app stays at `C:\Projects\DigiThane`. When Hitesh ends a build session (“Good Bye” / “See you”), this repo is updated and pushed so Netlify can rebuild.

## Netlify

- Build: `npm run build`
- Publish: `dist`
- **Ask the Development Cell** uses form name `pmo-question` (Forms detection must stay on).
- Email alerts (optional): Site configuration → Notifications → Form submission notifications  
  (or Forms → open `pmo-question` → Notifications). Add the inbox that should receive questions.
- Optional: site password

## Local preview

```
npm install
npm run dev
```

Dev server: http://localhost:3002/
