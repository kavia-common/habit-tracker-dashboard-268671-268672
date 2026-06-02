# Habit Tracker Frontend

React dashboard app for habit management: sidebar navigation, habit list/detail, calendar heatmap, stats charts, reminders UX, and settings.

## Run

```bash
npm install
npm start
```

## Environment variables

This app uses build-time React variables (must be prefixed with `REACT_APP_`):

- `REACT_APP_API_BASE`: Preferred API base (e.g., `https://api.example.com`)
- `REACT_APP_BACKEND_URL`: Alternative backend URL if `REACT_APP_API_BASE` is not set
- `REACT_APP_FRONTEND_URL`: Used for display/links (fallback: `window.location.origin`)
- `REACT_APP_WS_URL`: Reserved for future realtime features (optional)

### Fallback behavior

If the backend is unavailable/unreachable, the app falls back to a local offline store persisted in `localStorage`. This keeps the UI usable for demos and early development.
