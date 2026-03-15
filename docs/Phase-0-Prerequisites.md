# Phase 0 — Prerequisites

**Before you write a single line of code, get your machine ready.**

---

## Navigation

← Back to [LEARNING_GUIDE.md](../LEARNING_GUIDE.md)  
→ Next: [Phase-1-Project-Setup.md](Phase-1-Project-Setup.md)

---

## Tools to Install

| Tool | Version | Why You Need It | Download |
|---|---|---|---|
| Node.js | 22 LTS | Runs the React dev server and npm | https://nodejs.org |
| .NET SDK | 10 | Builds and runs the backend API | https://dotnet.microsoft.com/download |
| Git | Latest | Version control | https://git-scm.com |
| VS Code or Cursor | Latest | Your code editor | https://code.visualstudio.com |

---

## Step 0.1 — Install Node.js 22 LTS

1. Go to https://nodejs.org and download the **LTS** version (22.x).
2. Run the installer and follow the prompts.
3. Verify the install:

```bash
node --version   # should print v22.x.x
npm --version    # should print 10.x.x or higher
```

---

## Step 0.2 — Install .NET 10 SDK

1. Go to https://dotnet.microsoft.com/download
2. Download **.NET 10 SDK** for your operating system (macOS in this case).
3. Run the installer.
4. Verify:

```bash
dotnet --version   # should print 10.x.x
```

---

## Step 0.3 — Install Git

1. Go to https://git-scm.com and download the macOS installer.
2. After installing, verify:

```bash
git --version   # should print git version 2.x.x
```

---

## Step 0.4 — Install VS Code Extensions

Open VS Code (or Cursor) and install these extensions. You can search for them by name in the Extensions panel (`Cmd+Shift+X`):

| Extension | ID | Purpose |
|---|---|---|
| C# Dev Kit | `ms-dotnettools.csdevkit` | .NET IntelliSense, syntax highlighting, debugger |
| ES7+ React snippets | `dsznajder.es7-react-js-snippets` | React/TypeScript code snippets |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind class names |
| Thunder Client | `rangav.vscode-thunder-client` | API testing (alternative to Postman) |
| Prettier | `esbenp.prettier-vscode` | Auto-format your code on save |

**Recommended settings** — add to your VS Code `settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2
}
```

---

## Step 0.5 — Verify Everything Works

Run all checks at once:

```bash
node --version && npm --version && dotnet --version && git --version
```

Expected output (versions may differ slightly):

```
v22.14.0
10.9.0
10.0.100
git version 2.47.0
```

---

## What You'll Learn in This Project

Before you start Phase 1, here is a quick map of what each phase teaches:

| Phase | Backend (.NET) | Frontend (React) |
|---|---|---|
| 1 | .csproj, Program.cs, EF Core migrations | Vite, TypeScript, project structure |
| 2 | ASP.NET Core Identity, JWT tokens, Controllers | useState, useEffect, Context API, forms |
| 3 | HttpClient, service classes, JSON parsing | useCallback, debounce, conditional rendering |
| 4 | [Authorize], EF Core queries, REST conventions | Custom hooks, state lifting |
| 5 | CORS config, appsettings | Vite proxy, responsive layout, UX polish |

---

## Checkpoint ✓

Before moving on, confirm:

- [ ] `node --version` prints v22.x.x
- [ ] `dotnet --version` prints 10.x.x
- [ ] `git --version` prints a version number
- [ ] VS Code has the C# Dev Kit extension installed

---

→ Ready? Continue to **[Phase-1-Project-Setup.md](Phase-1-Project-Setup.md)**
