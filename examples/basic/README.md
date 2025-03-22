# Basic Shimmy Example

This is a basic example of using the Shimmy framework. It demonstrates:

1. Basic SPA setup with Shimmy
2. Hot module reloading
3. Component structure
4. State management

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open http://localhost:3000 in your browser

## Project Structure

```
basic/
  ├── src/
  │   ├── components/     # Reusable components
  │   ├── pages/         # Page components
  │   ├── store/         # State management
  │   └── main.ts        # Application entry point
  ├── index.html         # HTML template
  ├── package.json       # Dependencies and scripts
  ├── tsconfig.json      # TypeScript configuration
  └── vite.config.ts     # Vite configuration
``` 