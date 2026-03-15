# Phase 5 — Polish & Run the Full App

**Days 11–12**

---

## Navigation

← Previous: [Phase-4-Favorites.md](Phase-4-Favorites.md)  
→ Next: [Phase-6-Stretch-Goals.md](Phase-6-Stretch-Goals.md) (Optional)

---

## What You'll Build

By the end of this phase, the full application runs end-to-end and feels polished:

- Vite dev proxy configured so you no longer have HTTPS certificate warnings
- A guest who clicks "Save" is redirected to login (not silently ignored)
- The final folder structure matches the target layout
- Both the backend and frontend run together cleanly
- The app is responsive on mobile

---

## Learning Goals

- How the Vite development proxy works and why it simplifies local development
- TailwindCSS responsive grid utilities (`sm:`, `md:`, `lg:`)
- UX principles: every user action should have feedback (loading, error, empty, success states)
- How to run a full-stack project locally with two terminals

---

## Step 5.1 — Configure the Vite Proxy

Right now, your React app calls `https://localhost:7001/api/...` directly. This triggers an HTTPS certificate warning in Chrome during development.

A cleaner approach: configure Vite to proxy `/api` requests. React calls `/api/...` (plain HTTP, no port), and Vite silently forwards them to the .NET backend.

Open `mylib-client/vite.config.ts` and update it:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

Now open `mylib-client/src/services/api.ts` and change the `baseURL`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // Was: 'https://localhost:7001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mylib_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

> **How the proxy works:**
> `fetch('/api/auth/login')` → Vite intercepts it → forwards to `https://localhost:7001/api/auth/login` → returns the response to React.
> The browser only ever sees `localhost:5173`, so no CORS errors and no certificate warnings.

---

## Step 5.2 — Verify CORS Is Still Configured

Because the proxy handles the cross-origin issue in development, you may wonder if CORS is still needed. The answer is: **yes, keep it**.

In production, your React app will be on a different domain than your API. CORS must be configured on the server to allow that domain. The Vite proxy only works in development.

Your `Program.cs` should still have:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

And in the middleware pipeline:

```csharp
app.UseCors("ReactApp");
```

---

## Step 5.3 — Verify the Final Folder Structure

At this point your project should match this layout exactly. Use it as a checklist:

```
Library/
├── MyLib.sln
├── PRD.md
├── LEARNING_GUIDE.md
├── docs/
│   ├── Phase-0-Prerequisites.md
│   ├── Phase-1-Project-Setup.md
│   ├── Phase-2-Authentication.md
│   ├── Phase-3-Book-Search.md
│   ├── Phase-4-Favorites.md
│   ├── Phase-5-Polish.md
│   ├── Phase-6-Stretch-Goals.md
│   └── Quick-Reference.md
├── MyLib.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── BooksController.cs
│   │   └── FavoritesController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Models/
│   │   ├── ApplicationUser.cs
│   │   ├── Favorite.cs
│   │   └── DTOs/
│   │       ├── RegisterDto.cs
│   │       ├── LoginDto.cs
│   │       └── AuthResponseDto.cs
│   ├── Services/
│   │   └── OpenLibraryService.cs
│   ├── Migrations/
│   │   └── (generated files)
│   ├── appsettings.json
│   ├── mylib.db
│   ├── MyLib.Api.csproj
│   └── Program.cs
└── mylib-client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── BookCard.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   └── useFavorites.ts
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── SearchPage.tsx
    │   │   └── FavoritesPage.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── App.tsx
    │   └── index.css
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Step 5.4 — Review App.tsx (Final Version)

Your `App.tsx` should look like this at the end of Phase 4–5:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## Step 5.5 — Run the Full App

Open **two terminal windows** (side by side works well).

**Terminal 1 — Backend:**

```bash
cd ~/Documents/WebProjects-\ \(.Net\)/Library/MyLib.Api
dotnet run
```

Look for: `Now listening on: https://localhost:7001`

**Terminal 2 — Frontend:**

```bash
cd ~/Documents/WebProjects-\ \(.Net\)/Library/mylib-client
npm run dev
```

Look for: `Local: http://localhost:5173/`

Open `http://localhost:5173` in your browser.

---

## Step 5.6 — Run the Full User Flow

Walk through the complete flow to confirm everything works:

1. **Register** a new account at `/register`
2. **Login** at `/login` — verify the navbar updates
3. **Search** for a book (e.g., "dune") on the home page
4. **Save** a book — verify the heart turns red
5. Navigate to **Favorites** — verify the book appears
6. **Remove** the book from favorites — verify it disappears
7. **Logout** — verify the navbar resets
8. Try to visit `/favorites` while logged out — verify redirect to login
9. **Refresh** the page after logging in — verify you stay logged in

---

## Step 5.7 — Test on a Narrow Window (Mobile Check)

Drag your browser window to about 375px wide and verify:

- The navbar does not overflow or break
- The book grid adapts to 2 columns
- Forms are still usable and not clipped

The TailwindCSS classes `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6` handle this automatically.

---

## Checkpoint ✓ — Final Verification

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Full register → login → search → favorite → logout flow works
- [ ] Refreshing the page keeps you logged in
- [ ] `/favorites` redirects guests to login
- [ ] The app looks reasonable on mobile width
- [ ] Both `MyLib.Api/` and `mylib-client/` exist with all required files

---

**Congratulations — you have built MyLib.**

You have learned:
- How to build a .NET 10 Web API with EF Core, Identity, and JWT
- How to build a React 19 TypeScript app with routing, Context, and custom hooks
- How the frontend and backend communicate securely
- How to persist data in SQLite and read it back

→ Continue to **[Phase-6-Stretch-Goals.md](Phase-6-Stretch-Goals.md)** if you want to take the project further.  
→ See **[Quick-Reference.md](Quick-Reference.md)** for a summary of all commands and patterns used.
