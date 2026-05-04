# Speeding Detection System

This project contains a Django backend and a React frontend generated from the Figma "Traffic Monitoring System UI" design.

The backend is responsible for the Django application, database models, admin site, and future API logic. The frontend is a Vite React app that provides the user interface for traffic monitoring, violations, payments, dashboards, and admin screens.

## Project Structure

```text
speeding-detection-system/
├── data/
│   └── useful-resources.txt
├── speed_detection/
│   ├── apps/
│   │   ├── tolls/
│   │   ├── users/
│   │   └── vehicles/
│   ├── common/
│   │   └── models.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── vite.config.ts
│   │   └── index.html
│   ├── static/
│   │   └── frontend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── manage.py
│   └── requirements.txt
├── .gitignore
├── LICENSE
└── README.md
```

## Backend

The Django backend lives in:

```text
speed_detection/
```

Important backend folders:

- `speed_detection/config/`: main Django project configuration.
- `speed_detection/config/settings.py`: installed apps, database settings, static file settings, and template settings.
- `speed_detection/config/urls.py`: URL routes. The React frontend is served from `/`, and Django admin is served from `/django-admin/`.
- `speed_detection/apps/users/`: user-related Django app.
- `speed_detection/apps/vehicles/`: vehicle-related Django app.
- `speed_detection/apps/tolls/`: toll and traffic-related Django app.
- `speed_detection/common/`: shared Django models used by multiple apps.
- `speed_detection/requirements.txt`: Python dependencies.

The backend uses PostgreSQL through Docker Compose.

### RoadEye Backend API

The backend now includes the complete RoadEye MVP described in the team reports:

- Session authentication with user roles: `driver`, `official`, `admin`.
- Vehicles with owners and registration metadata.
- Toll stations, connected toll routes, speed limits, Google Maps distance/duration cache fields, and daily expected route times.
- Toll captures with license plate OCR metadata and image snapshot paths.
- Automatic traversal detection between entry and exit tolls.
- Speeding detection based on distance, observed travel time, expected duration, speed limit, and tolerance.
- Automatic fine generation, 50% fast-payment discount within 7 days, due dates, and statuses.
- Email/SMS notification records for new fines. Email uses Django console email by default; SMS is stored as a sent demo notification.
- Appeal submission and official review workflow.
- Demo payment gateway records and paid fine status updates.
- Admin statistics for issued, paid, unpaid, appealed, and cancelled fines.

Important API routes:

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/me/

GET  /api/tolls/
POST /api/tolls/                 official/admin
GET  /api/connections/
POST /api/connections/           official/admin
GET  /api/vehicles/
POST /api/vehicles/
POST /api/captures/              official/admin, triggers traversal/fine detection
GET  /api/traversals/            official/admin
GET  /api/fines/
GET  /api/fines/<id>/
POST /api/fines/<id>/pay/
GET  /api/appeals/
POST /api/appeals/
POST /api/appeals/<id>/review/   official/admin
GET  /api/statistics/
```

Useful backend commands:

```bash
cd speed_detection
docker compose run --rm web python manage.py migrate
docker compose run --rm web python manage.py seed_roadeye_demo
docker compose run --rm web python manage.py sync_connection_times
docker compose run --rm web python manage.py test apps.tolls
```

Demo users created by `seed_roadeye_demo`:

```text
Official: official@roadeye.local / official123
Driver:   driver@roadeye.local / driver123
```

## Frontend

The Figma UI was moved into:

```text
speed_detection/frontend/
```

Important frontend folders:

- `speed_detection/frontend/src/main.tsx`: React entry point.
- `speed_detection/frontend/src/app/App.tsx`: root React component.
- `speed_detection/frontend/src/app/routes.ts`: frontend routes.
- `speed_detection/frontend/src/app/pages/`: main UI pages.
- `speed_detection/frontend/src/app/components/`: reusable UI components.
- `speed_detection/frontend/src/styles/`: global styles, theme, Tailwind, and fonts.
- `speed_detection/frontend/package.json`: frontend dependencies and scripts.
- `speed_detection/frontend/vite.config.ts`: Vite configuration.

When the frontend is built, Vite writes the production files into:

```text
speed_detection/static/frontend/
```

Django then serves that built frontend from:

```text
http://127.0.0.1:8000/
```

For frontend-only development, Vite serves the React app from:

```text
http://127.0.0.1:5173/
```

## Frameworks And Tools

Backend:

- Python
- Django 5.2.12
- PostgreSQL 16
- Docker
- Docker Compose
- psycopg2-binary for PostgreSQL database access

Frontend:

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 4
- React Router
- Radix UI components
- Material UI icons
- Lucide React icons
- Recharts for charts
- Sonner for toast notifications

## How It Works

The React frontend is developed as a normal Vite app inside `speed_detection/frontend`.

During development, you can run Vite directly. This gives fast refresh and is the best place to work on UI changes:

```bash
cd speed_detection/frontend
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

For Django integration, build the frontend:

```bash
cd speed_detection/frontend
npm run build
```

The build output goes to:

```text
speed_detection/static/frontend/
```

Django is configured to load `index.html` from that folder. The main route `/` and frontend browser routes are handled by the React app. Static assets are served from `/static/frontend/...`.

The Django admin route is:

```text
http://127.0.0.1:8000/django-admin/
```

It was placed there so the React app can use `/admin` for its own admin dashboard screen.

## Run The Full Project

From the Django project folder:

```bash
cd speed_detection
docker compose up -d
```

Open the Django-served app:

```text
http://127.0.0.1:8000/
```

Check running containers:

```bash
cd speed_detection
docker compose ps
```

Run Django system checks:

```bash
cd speed_detection
docker compose run --rm web python manage.py check
```

## Run The Frontend Only

From the frontend folder:

```bash
cd speed_detection/frontend
npm install --cache /private/tmp/speeding-detection-npm-cache
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

## Build The Frontend For Django

```bash
cd speed_detection/frontend
npm run build
```

This updates:

```text
speed_detection/static/frontend/
```

After building, the Django app at `http://127.0.0.1:8000/` serves the latest built UI.

## Notes

- The local macOS `python3` on this machine is Python 3.9.6, which is too old for Django 5.2.12.
- The Docker backend uses Python 3.11, so backend checks and backend development should be run through Docker unless a newer local Python version is installed.
- `npm install` may need the temporary cache path shown above if the default npm cache has permission issues.
- `docker-compose.yml` currently works, but Docker warns that the top-level `version` field is obsolete.
- `npm audit` currently reports one high severity vulnerability from frontend dependencies. Review before production use.
