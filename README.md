# MoveWithNat

[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/move-with-nat/ci.yml?branch=master)](https://github.com/YOUR_USERNAME/move-with-nat/actions)  
[![Version](https://img.shields.io/badge/version-0.0.1-blue)]()  
[![License](https://img.shields.io/badge/license-Unlicensed-lightgrey)]()

A responsive web application enabling personal trainers and administrators to create, manage, and share structured training plans with clients—eliminating the need for spreadsheets. Clients can view assigned plans, track exercise progress, and record reasons for incomplete exercises.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
3. [Available Scripts](#available-scripts)
4. [Project Scope (MVP)](#project-scope-mvp)
5. [Project Status](#project-status)
6. [License](#license)
7. [Additional Resources](#additional-resources)

## Tech Stack

- **Frontend**: Astro 5 · React 19 · TypeScript 5
- **Styling**: Tailwind CSS 4 · Shadcn/ui · clsx · class-variance-authority
- **Backend & Database**: Supabase (Auth, RLS, PostgreSQL)
- **Media**: Vimeo private playback (token-based)
- **Email**: SendGrid transactional emails
- **Build & Tooling**: Vite · GitHub Actions · DigitalOcean App Platform
- **Utilities**: tailwind-merge · lucide-react · tw-animate-css

## Getting Started Locally

### Prerequisites

- Node.js 22 (or your preferred LTS)
- npm or yarn
- Git

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/move-with-nat.git
cd move-with-nat
npm install
# or
# yarn install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# SendGrid
SENDGRID_API_KEY=your-sendgrid-apikey

# Vimeo
VIMEO_TOKEN=your-vimeo-token

```

### Running in Development

```bash
npm run dev
# or
# yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` — Start Astro development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run format` — Format code with Prettier

## Project Scope (MVP)

- **Authentication & Authorization**
  - Supabase Auth with email link login & 1h password reset
  - Role-based RLS: Administrator, Trainer, Client
- **Exercises Management**
  - CRUD operations: name, description, tempo, default weight, Vimeo link
- **Training Plans**
  - Trainers create/edit/delete/hide plans for assigned clients
- **User Management**
  - Admin invites/manages trainers & clients; email activation links
- **Notifications**
  - SendGrid for account activation, password reset, new plan, plan updates
- **Progress Tracking**
  - Clients mark exercises as done/undone with standard or custom reasons
- **Pagination & Filtering**
  - Offset–limit pagination (20 items/page), filter by name, status, date, trainer
- **Profile Editing**
  - Role-specific profile updates for admins, trainers, clients
- **Admin Utilities**
  - Manage standard reasons for incomplete exercises

## Project Status

🚧 **In Development (MVP Stage)**  
Version 0.0.1 — Core features implemented; testing and polishing underway.

## License

This project is currently unlicensed. Please add a `LICENSE` file to specify terms.

## Additional Resources

- [Product Requirements (PRD)](.ai/prd.md)
- [API & Database Design](.ai/api-plan.md, .ai/db-plan.md)
- [Tech Stack Rationale](.ai/tech-stack.md)
- [Supabase Migrations](supabase/migrations/)
- [Astro Documentation](https://docs.astro.build)
- [Supabase Documentation](https://supabase.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Vimeo Developer API](https://developer.vimeo.com)
