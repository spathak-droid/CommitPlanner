# Module Federation Integration Guide

## Overview
The Weekly Commit frontend is a Module Federation remote (`weeklyCommitRemote`) that can be consumed by any host application.

## Remote Configuration
- **Remote name:** `weeklyCommitRemote`
- **Entry:** `http://<frontend-host>:<port>/remoteEntry.js`
- **Dev URL:** `http://localhost:3001/remoteEntry.js`

## Exposed Modules
| Module Path | Component | Description |
|---|---|---|
| `./WeeklyCommitApp` | Full App | Complete app with routing, auth, sidebar |
| `./WeeklyPlanView` | WeeklyPlanPage | IC weekly plan view (standalone) |
| `./ManagerDashboard` | ManagerDashboardPage | Manager dashboard (standalone) |
| `./TeamAlignmentView` | TeamAlignmentPage | RCDO alignment view (standalone) |
| `./AdminSetupView` | SettingsPage | Admin/settings view (standalone) |

## Host Configuration
Add to your host webpack config:
```js
new ModuleFederationPlugin({
  remotes: {
    weeklyCommitRemote: 'weeklyCommitRemote@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
    zustand: { singleton: true, requiredVersion: '^4.5.0' },
  },
})
```

## Auth Token Passthrough
The remote supports two auth methods:
1. **httpOnly cookie** (preferred) — set by the `/api/auth/login` endpoint
2. **Bearer token** — pass via `window.__AUTH_TOKEN__` before loading the remote

## CSS Isolation
The remote uses Tailwind CSS with a custom Material Design 3 color palette. Styles are scoped but not fully isolated. If your host also uses Tailwind, ensure no class conflicts by using different prefixes.

## Test Harness
A minimal test host is provided in `federation-test-host/`:
```bash
cd federation-test-host && npm install && npm run dev
# Then open http://localhost:3000
# Requires the remote running on port 3001
```
