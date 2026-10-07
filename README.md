# Dairy Farm Manager

A modern frontend for managing dairy farm operations efficiently. Track herd health, milk production, breeding records, health treatments, and operational notes in a single offline-first application.

## Features

- Cow management and herd tracking
- Milk production logging by session
- Breeding and pregnancy tracking
- Health and treatment records
- Notes for farm operations
- Offline-first data storage using IndexedDB
- Responsive layout for desktop and tablet use

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Dexie
- Lucide React

## Getting Started

### Install dependencies

```bash
npm install

## Run Locally
npm run dev
## Open
http://localhost:5173
##Production build
npm run build

##Project Structure

src/
├── app/
│   └── router.tsx
├── components/
│   └── Card.tsx
├── features/
│   ├── cows/
│   │   ├── components/
│   │   └── hooks/
│   ├── dashboard/
│   ├── layout/
│   ├── milk/
│   ├── breeding/
│   ├── health/
│   └── notes/
├── lib/
│   ├── db.ts
│   └── schemas.ts
├── App.tsx
├── index.css
├── main.tsx
└── App.css
