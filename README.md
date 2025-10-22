# MoveWithNat

A responsive web application for personal trainers to create, manage, and share structured training plans with their clients—eliminating the need for spreadsheets and delivering a seamless user experience.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Running the Development Server](#running-the-development-server)
3. [Available Scripts](#available-scripts)
4. [Project Scope](#project-scope)
5. [Project Status](#project-status)
6. [License](#license)

## Tech Stack

- **Frameworks & Languages**: Astro 5, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **State & Utilities**: clsx, class-variance-authority, tailwind-merge, tw-animate-css
- **Authentication & Database**: Supabase Auth (email link), RLS (Row-Level Security)
- **Media & Email**: Vimeo embeds, SendGrid transactional emails
- **Tooling & CI/CD**:
  - Node.js v22.14.0 (managed via [`.nvmrc`](.nvmrc))
  - GitHub Actions (recommended)
  - DigitalOcean App Platform or CDN-backed hosting
- **Linting & Formatting**: ESLint, Prettier, Husky, lint-staged

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (use nvm: `nvm install 22 && nvm use 22`)
- npm (v8+)
- A Supabase project with Auth & RLS enabled
- SendGrid account and API key
- Vimeo access token for private video embedding

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/move-with-nat.git
   cd move-with-nat
   ```
2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

### Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Vimeo
VIMEO_ACCESS_TOKEN=your-vimeo-access-token
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Available Scripts

- `npm run dev`  
  Start the Astro development server with hot-reload.
- `npm run build`
  Build the static production site.
- `npm run preview`
  Preview the production build locally.
- `npm run astro`  
  Run the Astro CLI.
- `npm run lint`  
  Run ESLint to check for code issues.
- `npm run lint:fix`  
  Run ESLint and automatically fix problems.
- `npm run format`  
  Run Prettier to format all files.

## Project Scope

This project’s MVP includes:

- **Authentication & Authorization**
  - Email-link login & password reset (Supabase Auth)
  - Role-based access control (administrator, trainer, trainee) via RLS
- **Exercise Library**
  - CRUD for exercises (name, description, Vimeo link)
- **Training Plan Management**
  - Trainers create, edit, hide/unhide, and delete plans for their assigned trainees
- **User Management**
  - Administrators add/edit/delete/suspend/reactivate trainers & trainees
  - Email activation & reset flow via SendGrid
- **Notifications**
  - Transactional emails (account activation, password reset, new plan)
  - In-app notification banner for unread alerts
- **Pagination & Filtering**
  - Offset–limit pagination (default 20 items/page)
  - Filtering by name, status, creation date, and trainer
- **Audit Log**
  - Records of CRUD events on plans and accounts with metadata (user, action, timestamp)
  - 90-day retention

## Project Status

🚧 **MVP in development**  
Core features are actively being built in alignment with the PRD’s MVP requirements.

## License

This project does not currently include a license. Please add a `LICENSE` file to specify usage permissions.
