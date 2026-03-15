# Quick Reference

A condensed cheat-sheet for everything used in the MyLib project.

---

## Navigation

← Back to [LEARNING_GUIDE.md](../LEARNING_GUIDE.md)

---

## .NET CLI Commands

| Command | What It Does |
|---|---|
| `dotnet new sln -n MyLib` | Create a solution file |
| `dotnet new webapi -n MyLib.Api --use-controllers` | Scaffold a Web API project |
| `dotnet sln add MyLib.Api.csproj` | Add project to solution |
| `dotnet run` | Build and start the API |
| `dotnet build` | Build without running |
| `dotnet watch run` | Run with hot reload |
| `dotnet add package <Name>` | Install a NuGet package |
| `dotnet ef migrations add <Name>` | Generate a new database migration |
| `dotnet ef database update` | Apply pending migrations to the DB |
| `dotnet ef database drop` | Delete the database (reset) |
| `dotnet ef migrations remove` | Undo the last migration |
| `dotnet publish -c Release` | Build for production |

---

## npm / Node Commands

| Command | What It Does |
|---|---|
| `npm create vite@latest mylib-client -- --template react-ts` | Scaffold React + TypeScript with Vite |
| `npm install` | Install all dependencies from `package.json` |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm install <package>` | Add a runtime dependency |
| `npm install -D <package>` | Add a dev-only dependency |

---

## NuGet Packages Used

| Package | Purpose |
|---|---|
| `Microsoft.EntityFrameworkCore.Sqlite` | SQLite database provider for EF Core |
| `Microsoft.EntityFrameworkCore.Design` | EF Core migration tooling |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | Identity tables via EF Core |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT validation middleware |

---

## npm Packages Used

| Package | Purpose |
|---|---|
| `axios` | HTTP client for API calls |
| `react-router-dom` | Client-side routing |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/vite` | Vite plugin for Tailwind v4 |

---

## React Hooks Reference

| Hook | Where It Is Used | What It Does |
|---|---|---|
| `useState` | All pages/components | Declares local state that triggers re-renders when changed |
| `useEffect` | `AuthContext`, `SearchPage` | Runs side effects after render; optionally on specific dependency changes |
| `useCallback` | `SearchPage`, `useFavorites` | Returns a memoized function reference that only changes if dependencies change |
| `useContext` | `useAuth()`, `useTheme()` | Reads a value from a React Context |
| `useNavigate` | `LoginPage`, `RegisterPage` | Programmatic navigation between routes |
| `useRef` | (Stretch Goal 2) | Access a DOM element directly without re-rendering |

---

## React Patterns Reference

| Pattern | File | Description |
|---|---|---|
| Controlled Input | `LoginPage`, `RegisterPage` | `value={state}` + `onChange` keeps React as the source of truth for form values |
| Context + Provider | `AuthContext.tsx` | Wrap the app in `<AuthProvider>` so any child can call `useAuth()` |
| Custom Hook | `useFavorites.ts` | A function starting with `use` that encapsulates stateful logic and can be shared across components |
| Protected Route | `ProtectedRoute.tsx` | Renders children if authenticated; redirects to `/login` otherwise |
| Conditional Rendering | All pages | `{condition && <Component />}` or `{condition ? <A /> : <B />}` |
| Debounce with useEffect | `SearchPage.tsx` | `setTimeout` inside `useEffect` + `clearTimeout` in the cleanup function |
| State updater function | `useFavorites.ts` | `setState(prev => ...)` ensures you always work off the latest state value |

---

## JWT Flow

```
1. User submits login form
   ↓
2. POST /api/auth/login → { email, password }
   ↓
3. Backend: UserManager.FindByEmailAsync()
           SignInManager.CheckPasswordSignInAsync()
   ↓
4. Backend: new JwtSecurityToken(claims, expiry, signingKey)
   ↓
5. Response: { token: "eyJ...", user: { id, email, username } }
   ↓
6. Frontend: localStorage.setItem('mylib_token', token)
   ↓
7. Every API request: Authorization: Bearer eyJ...
   ↓
8. Backend middleware validates token automatically
   ↓
9. [Authorize] endpoints: User.FindFirstValue(ClaimTypes.NameIdentifier) → userId
```

---

## EF Core Cheat Sheet

```csharp
// Query all favorites for a user (WHERE + ORDER BY)
var favorites = await _context.Favorites
    .Where(f => f.UserId == userId)
    .OrderByDescending(f => f.SavedAt)
    .ToListAsync();

// Check if a record exists
bool exists = await _context.Favorites
    .AnyAsync(f => f.UserId == userId && f.OpenLibraryKey == key);

// Insert a new record
_context.Favorites.Add(favorite);
await _context.SaveChangesAsync();

// Delete a record
_context.Favorites.Remove(favorite);
await _context.SaveChangesAsync();

// Find one record (returns null if not found)
var fav = await _context.Favorites
    .FirstOrDefaultAsync(f => f.UserId == userId && f.OpenLibraryKey == key);
```

---

## Open Library API Endpoints

| Purpose | URL |
|---|---|
| Search books | `https://openlibrary.org/search.json?q=<query>&fields=key,title,author_name,cover_i,first_publish_year&limit=20` |
| Get book details | `https://openlibrary.org/works/<olid>.json` |
| Book cover (medium) | `https://covers.openlibrary.org/b/id/<cover_i>-M.jpg` |
| Book cover (large) | `https://covers.openlibrary.org/b/id/<cover_i>-L.jpg` |

---

## Project API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/logout` | No | Client-side logout |
| GET | `/api/books/search?q=<query>` | No | Search books via Open Library |
| GET | `/api/favorites` | Yes | Get current user's favorites |
| POST | `/api/favorites` | Yes | Add a book to favorites |
| DELETE | `/api/favorites/{openLibraryKey}` | Yes | Remove a book from favorites |

---

## Common Errors & Fixes

| Error | Likely Cause | Fix |
|---|---|---|
| `CORS policy error` in browser console | CORS not configured or wrong origin | Verify `WithOrigins("http://localhost:5173")` in `Program.cs` and `app.UseCors("ReactApp")` is present |
| `401 Unauthorized` on favorites | Token missing or expired | Check that `localStorage.setItem` ran after login; verify `Authorization: Bearer ...` header in Network tab |
| `dotnet ef` command not found | EF CLI tool not installed | Run `dotnet tool install --global dotnet-ef` |
| `Network error` in React | API not running | Make sure `dotnet run` is running in `MyLib.Api/` |
| White screen in React | JavaScript error | Open browser DevTools → Console tab to see the error |
| `Password too short` on register | Identity password rules | Password must be 8+ characters with at least one digit |
| `Unique constraint failed` on POST /favorites | Duplicate entry | Already favorited — this is expected behavior (returns 409) |
