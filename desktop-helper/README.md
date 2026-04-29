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
- `POST /session/video`

Start a session with:

```json
{
  "storageRoot": "C:\\Users\\HUU HIEU\\Downloads\\Temp",
  "recordName": "Record_4_29_2026_20_54_12"
}
```

The helper creates a session folder and saves screenshots as:

```text
Image_Record_4_29_2026_20_54_12_001_click.jpg
Image_Record_4_29_2026_20_54_12_002_type.jpg
Image_Record_4_29_2026_20_54_12_003_select.jpg
```

## Privacy

The helper installs Windows low-level mouse and keyboard hooks only during an active session. It does not store typed characters. Keyboard events are recorded as `type` actions with timestamp, cursor position, and a screenshot.
