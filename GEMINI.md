# NutriCoachMe-Active-API

This is a Node.js Express API for the **NutriCoachMe** platform, which provides nutrition coaching services. The API handles payments, user authentication, data synchronization with external services (like Google and Stripe), and AI integrations.

## Project Overview

- **Main Technologies**:
  - **Node.js** with **Express** (v4.21.1)
  - **ES Modules** (`type: "module"` in `package.json`)
  - **Stripe** for payment processing and subscription management.
  - **Supabase** for database and authentication.
  - **OpenAI** for AI-driven coaching features.
  - **Node-cron** for scheduled background tasks (e.g., Sunday check-ins, biometrics syncing).
  - **Playwright** for health-check and automated testing.
  - **Email Clients**: Support for both Mailgun and SendGrid.

## Architecture

- **Entry Point**: `index.js`
  - Initializes Express, sets up middleware (CORS, body-parser, static files).
  - Mounts controllers as routers.
  - Starts the cron-based `scheduledTasks.js`.
- **Controllers**: Located in `controllers/`. Each controller uses `express.Router()` and is mounted on the root path `/` or specific paths (e.g., `/webhook/stripe`).
- **Data Layer**: Located in `data/`. Contains wrappers for external services like Google, SendGrid, and Supabase.
- **Tasks**: Located in `tasks/`. Background jobs scheduled via `cronService.js`.
- **Services**: Located in `service/`. Shared logic like `cronService.js`.
- **Utils**: Located in `utils/`. General helper functions like `dateUtils.js`.
- **Error Handling**: Located in `error/log.js`. Provides `logError` and `logInfo` for consistent logging (to console in development, to `error_log.txt` in production).

## Building and Running

### Prerequisites
- **Node.js**: LTS version recommended (v18+).
- **Environment Variables**: A `.env` file is required. Refer to `.env.example` for the necessary keys. Key variables include:
  - `STRIPE_TEST_SECRET_KEY` / `STRIPE_LIVE_SECRET_KEY`
  - `STRIPE_TEST_WEBHOOK_SECRET` / `STRIPE_LIVE_WEBHOOK_SECRET`
  - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`
  - `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
  - `PORT` (defaults to 3000)

### Commands
- **Install Dependencies**: `npm install`
- **Start the Server**: `npm start` (Runs `node index.js`)
- **Run Tests**: `npm test` (Runs `playwright test`)
- **Run Specific Tests**:
  - `npx playwright test tests/tasks/cron.spec.js` (Verifies cron schedules)
- **Docker**:
  - Build: `docker compose build`
  - Start: `docker compose up -d`
  - Healthcheck: Available at `http://localhost:3000/api/health-check`

## Development Conventions

### Routing & Controllers
- Create new controllers in the `controllers/` directory.
- Use `express.Router()` to define routes.
- Import and mount the router in `index.js`.
- Example route naming: `/api/stripe/customer`, `/api/health-check`.
- **Naming Convention**: Controller filenames are typically lowercase (e.g., `stripecontroller.js`).

### Authentication
- Use the `authenticate` middleware from `controllers/authenticationcontroller.js` to protect sensitive routes.

### Logging
- Do **not** use `console.log` directly in production code (except for server startup).
- Use `logError(error)` and `logInfo(message)` from `@/error/log.js`.

### Error Handling
- Wrap asynchronous operations in `try-catch` blocks and use the logging utility.
- Return appropriate HTTP status codes (e.g., 400 for bad requests, 404 for not found, 500 for server errors).

### Scheduled Tasks
- Add new background jobs to `tasks/scheduledTasks.js`.
- Use the `scheduleTask` utility from `service/cronService.js`.
- Tasks are configured with the `Australia/Brisbane` timezone.
- **Production Safety**: Email tasks should check `process.env.NODE_ENV === 'production'` before sending real emails. In development, they should log the intent to the console instead.

### Testing
- Place Playwright tests in the `tests/` directory.
- Follow the convention of `.spec.js` for test files.
- **Cron Tests**: Ensure cron strings are validated using `node-cron.validate()`.

## Directory Structure

- `clients/`: Client implementations for external email services.
- `controllers/`: Request handlers and route definitions.
- `data/`: Service-specific data fetching and integration logic.
- `error/`: Centralized logging and error handling.
- `service/`: Core business logic and shared services.
- `tasks/`: Definitions for cron-scheduled background jobs.
- `templates/`: HTML templates (e.g., for emails).
- `tests/`: Automated test suite.
- `uploads/`: Directory for file uploads (created automatically on startup).
- `utils/`: Common utility functions.
