# Tailwind CSS + DaisyUI Setup Guide for Nx Next.js Projects

This guide provides step-by-step instructions for configuring Tailwind CSS 4.x with DaisyUI in an Nx monorepo with Next.js applications, based on the Polymode project configuration.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Implementation](#implementation)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Prerequisites

Before starting, ensure you have:

- **Node.js**: v20+
- **Package Manager**: pnpm v10.12.4+ (recommended for Nx monorepos)
- **Nx**: v21.2.3+
- Basic understanding of Next.js and Tailwind CSS

## 🏗️ Project Structure

This setup works in an Nx monorepo with the following structure:

```
your-nx-workspace/
├── apps/
│   ├── studio/                   # Next.js app
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── global.css    # Tailwind imports
│   │   ├── postcss.config.mjs
│   │   ├── next.config.js
│   │   └── package.json
│   └── renderer/                 # Another Next.js app
│       └── [same structure]
├── packages/                     # Shared libraries
├── package.json                  # Root dependencies
├── nx.json
└── tsconfig.base.json
```

---

## 📦 Installation

### 1. Root-Level Dependencies

Add Tailwind CSS and DaisyUI to your root `package.json`:

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.11",
    "daisyui": "^5.0.43",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.11"
  }
}
```

**Install the packages:**

```bash
pnpm install
```

> ⚠️ **Important**: Notice we're using Tailwind CSS v4.x which has a different configuration approach than v3.x

### 2. App-Level Dependencies

Each Next.js app should have minimal dependencies in its own `package.json`:

```json
{
  "name": "@your-org/studio",
  "version": "0.0.1",
  "private": true,
  "dependencies": {
    "next": "~15.3.5",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

---

## ⚙️ Configuration

### 1. PostCSS Configuration

Create `postcss.config.mjs` in each Next.js app directory:

```javascript
// apps/studio/postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

**Key Points:**

- Uses `@tailwindcss/postcss` plugin (Tailwind v4 syntax)
- No separate `tailwind.config.js` needed for v4
- Must be `.mjs` extension for ES modules

### 2. Global CSS Configuration

Create/update the global CSS file in each app:

```css
/* apps/studio/src/app/global.css */
@import 'tailwindcss';
@plugin "daisyui";
```

**Key Points:**

- Simple import syntax for Tailwind v4
- DaisyUI loaded as a plugin
- No need for `@tailwind base; @tailwind components; @tailwind utilities;`

### 3. Next.js Layout Configuration

Import the global CSS in your root layout:

```typescript
// apps/studio/src/app/layout.tsx
import './global.css';

export const metadata = {
  title: 'Studio App | Your Project',
  description: 'Studio application built with Next.js, Tailwind CSS and Nx',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 4. Next.js Configuration

Your `next.config.js` should use Nx plugins:

```javascript
// apps/studio/next.config.js
//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Nx-specific options
  },
};

const plugins = [
  withNx,
  // Add more Next.js plugins here if needed
];

module.exports = composePlugins(...plugins)(nextConfig);
```

### 5. Nx Configuration

Ensure your `nx.json` includes Next.js plugin configuration:

```json
{
  "plugins": [
    {
      "plugin": "@nx/next/plugin",
      "options": {
        "startTargetName": "start",
        "buildTargetName": "build",
        "devTargetName": "dev",
        "serveStaticTargetName": "serve-static"
      }
    }
  ],
  "generators": {
    "@nx/next": {
      "application": {
        "style": "none",
        "linter": "eslint"
      }
    }
  }
}
```

---

## 🎨 Implementation

### 1. Basic Component Example

Create a page using DaisyUI components:

```typescript
// apps/studio/src/app/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body text-center">
          <div className="avatar placeholder mb-4">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <span className="text-2xl">🎨</span>
            </div>
          </div>

          <h1 className="card-title text-3xl justify-center mb-2">
            Studio App
          </h1>

          <p className="text-base-content/70 mb-4">
            Hello World from{' '}
            <span className="text-primary font-semibold">@your-org/studio</span>
          </p>

          <div className="alert alert-success mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>✨ daisyUI is configured and working!</span>
          </div>

          <div className="card-actions justify-center">
            <button className="btn btn-primary btn-lg">
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          <div className="divider">Tech Stack</div>

          <div className="flex justify-center gap-2 flex-wrap">
            <div className="badge badge-success badge-lg">Next.js</div>
            <div className="badge badge-info badge-lg">Tailwind CSS</div>
            <div className="badge badge-secondary badge-lg">daisyUI</div>
            <div className="badge badge-accent badge-lg">Nx Monorepo</div>
          </div>

          <div className="stats shadow mt-4">
            <div className="stat place-items-center">
              <div className="stat-title">Framework</div>
              <div className="stat-value text-primary">Next.js</div>
              <div className="stat-desc">App Router</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. TypeScript Configuration

Ensure proper TypeScript configuration for each app:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", ".next"]
}
```

---

## 🎯 Usage Examples

### DaisyUI Components

```typescript
// Cards
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Card Title</h2>
    <p>Card content goes here</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-accent">Accent</button>

// Alerts
<div className="alert alert-success">
  <span>Success message!</span>
</div>

// Badges
<div className="badge badge-primary">New</div>
<div className="badge badge-secondary">Featured</div>

// Progress
<progress className="progress progress-primary w-full" value="70" max="100"></progress>

// Stats
<div className="stats shadow">
  <div className="stat">
    <div className="stat-title">Total Users</div>
    <div className="stat-value">1,234</div>
    <div className="stat-desc">↗︎ 400 (22%)</div>
  </div>
</div>
```

### Custom Tailwind Classes

```typescript
// Gradients
<div className="bg-gradient-to-br from-primary/10 to-secondary/10">

// Responsive Design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark Mode Support (DaisyUI handles this automatically)
<div className="bg-base-100 text-base-content">
```

---

## ✅ Best Practices

### 1. Consistent Color Usage

Use DaisyUI semantic colors for consistency:

```css
/* DaisyUI Color System */
primary          /* Main brand color */
secondary        /* Secondary brand color */
accent           /* Accent color */
neutral          /* Neutral color */
base-100         /* Background color */
base-200         /* Secondary background */
base-300         /* Tertiary background */
base-content     /* Text color on base */
```

### 2. Component Organization

```typescript
// Create reusable components
const Card = ({ children, className = '' }) => (
  <div className={`card bg-base-100 shadow-xl ${className}`}>
    <div className="card-body">{children}</div>
  </div>
);
```

### 3. Responsive Design

```typescript
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### 4. Nx Workspace Benefits

- **Shared Styling**: DaisyUI config is available across all apps
- **Consistent Theming**: One configuration for the entire monorepo
- **Build Optimization**: Nx caches CSS builds across apps

---

## 🐛 Troubleshooting

### Common Issues

1. **Styles not loading**

   ```bash
   # Clear Nx cache
   npx nx reset

   # Restart dev server
   npx nx dev your-app
   ```

2. **PostCSS errors**

   - Ensure `postcss.config.mjs` uses `.mjs` extension
   - Verify `@tailwindcss/postcss` is installed at root level

3. **DaisyUI classes not working**

   - Check `@plugin "daisyui";` is in global.css
   - Verify daisyui package is installed

4. **Build errors in production**
   ```bash
   # Test production build
   npx nx build your-app
   ```

### Development Commands

```bash
# Start development server
npx nx dev studio

# Build for production
npx nx build studio

# Lint styles
npx nx lint studio

# View project dependency graph
npx nx graph
```

---

## 🔄 Migration from Tailwind v3

If migrating from Tailwind CSS v3.x:

1. **Remove old config files**:

   ```bash
   rm tailwind.config.js
   ```

2. **Update CSS imports**:

   ```css
   /* Old (v3) */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* New (v4) */
   @import 'tailwindcss';
   ```

3. **Update PostCSS config**:

   ```javascript
   // Old
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };

   // New
   const config = {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   };
   export default config;
   ```

---

## 📚 Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [DaisyUI Documentation](https://daisyui.com/)
- [Nx Next.js Documentation](https://nx.dev/nx-api/next)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## 🎉 Conclusion

This setup provides:

- ✅ Modern Tailwind CSS v4 with simplified configuration
- ✅ DaisyUI component library integration
- ✅ Nx monorepo optimization and caching
- ✅ Next.js App Router compatibility
- ✅ TypeScript support
- ✅ Production-ready build configuration

The configuration is minimal, maintainable, and scales well across multiple applications in an Nx workspace.

---

**Happy coding! 🚀**
