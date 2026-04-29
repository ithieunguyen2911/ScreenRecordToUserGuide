# ScreenGuide Desktop Helper

Local Windows helper for capturing desktop input actions while the web app records the screen.

## Run

```powershell
npm run helper:dev
```

The helper listens on:

```text
http://127.0.0.1:55231
```

## API

- `GET /health`
- `POST /session/start`
- `POST /session/stop`
- `GET /session/actions`

## Privacy

The helper installs Windows low-level mouse and keyboard hooks only during an active session. It does not store typed characters. Keyboard events are recorded as `type` actions with timestamp, cursor position, and a screenshot.
