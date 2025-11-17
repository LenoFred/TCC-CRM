# TCC CRM Frontend

React-based frontend application for TCC Church CRM system.

## Technology Stack

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Service Worker for offline capability

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Backend API running on http://localhost:3001

## Installation

```bash
npm install
```

## Configuration

Create `.env` file in the codes directory:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

For production, update with your backend URL.

## Development

Start development server:

```bash
npm run dev
```

Application runs at http://localhost:5173

## Build

Create production build:

```bash
npm run build
```

Output is generated in `dist/` directory.

Preview production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── data/               # Static data
```

## Key Features

### Progressive Web App
- Installable on mobile and desktop
- Offline support with service worker
- App manifest for native-like experience

### Responsive Design
- Mobile-first approach
- Tablet and desktop layouts
- Touch-friendly interfaces

### UI Components
- Consistent design system with shadcn/ui
- Dark mode support
- Accessible components

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Consistent file naming (PascalCase for components)

### Component Organization
- One component per file
- Co-locate related components
- Use hooks for shared logic

### State Management
- React hooks for local state
- Context API for global state
- Minimize prop drilling

## Testing

Run linting:

```bash
npm run lint
```

## Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build application:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to hosting service

3. Configure environment variables:
   - Set `VITE_API_BASE_URL` to production backend URL

### Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (required)

## Troubleshooting

**Development server won't start:**
- Check Node.js version (18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 5173 is available

**API connection issues:**
- Verify backend is running
- Check VITE_API_BASE_URL in .env
- Verify CORS configuration in backend

**Build fails:**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for TypeScript errors: `npm run lint`
- Ensure all dependencies installed correctly

**Blank page after deployment:**
- Check browser console for errors
- Verify environment variables set correctly
- Ensure backend URL is accessible from deployment
