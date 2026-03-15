# Phase 6 — Stretch Goals (Optional)

**After completing Phases 1–5**

---

## Navigation

← Previous: [Phase-5-Polish.md](Phase-5-Polish.md)  
→ Reference: [Quick-Reference.md](Quick-Reference.md)

---

## Overview

These are independent enhancements you can tackle in any order after finishing the core app. Each one teaches a new concept and meaningfully improves the product.

| Goal | Difficulty | New Concepts |
|---|---|---|
| 1. Pagination | Easy | React page state, offset pagination |
| 2. Book Detail Modal | Medium | Modal patterns, `useRef`, portal rendering |
| 3. Dark Mode | Easy | TailwindCSS dark variant, localStorage for preferences |
| 4. Deploy | Medium | Azure App Service, Vercel, environment variables |

---

## Stretch Goal 1 — Pagination

### What to Build

A "Load More" button below the search results grid that appends the next page of books.

### Backend

The `/api/books/search` endpoint already supports `page` and `limit` query parameters.

No backend changes needed.

### Frontend

In `SearchPage.tsx`:

1. Add a `page` state:
   ```typescript
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(false);
   ```

2. Update `searchBooks` to accept a page number and append to existing results:
   ```typescript
   const searchBooks = useCallback(async (searchQuery: string, pageNum: number) => {
     // ...existing logic...
     const response = await api.get('/books/search', {
       params: { q: searchQuery, page: pageNum }
     });
     if (pageNum === 1) {
       setBooks(response.data.books);
     } else {
       setBooks((prev) => [...prev, ...response.data.books]);
     }
     setHasMore(response.data.books.length === 20);
   }, []);
   ```

3. Reset page to 1 whenever the query changes:
   ```typescript
   useEffect(() => {
     setPage(1);
   }, [query]);
   ```

4. Add a "Load More" button below the grid:
   ```typescript
   {hasMore && !loading && (
     <div className="text-center mt-8">
       <button
         onClick={() => setPage((p) => p + 1)}
         className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
       >
         Load More
       </button>
     </div>
   )}
   ```

### What You'll Learn
- Managing page state in React
- Appending data vs replacing data in state
- Offset-based pagination patterns

---

## Stretch Goal 2 — Book Detail Modal

### What to Build

Clicking a book card opens a modal with the full book description, subjects, and edition count.

### Backend

Implement `GET /api/books/{olid}` in `BooksController.cs`:

```csharp
[HttpGet("{olid}")]
public async Task<IActionResult> GetBook(string olid)
{
    var result = await _openLibraryService.GetBookDetailsAsync(olid);
    if (result == null) return NotFound();
    return Ok(result);
}
```

Add `GetBookDetailsAsync` to `OpenLibraryService.cs`:

```csharp
public async Task<object?> GetBookDetailsAsync(string olid)
{
    var response = await _httpClient.GetAsync($"works/{olid}.json");
    if (!response.IsSuccessStatusCode) return null;

    var json = await response.Content.ReadAsStringAsync();
    var data = JsonDocument.Parse(json);
    var root = data.RootElement;

    var description = "";
    if (root.TryGetProperty("description", out var descProp))
    {
        if (descProp.ValueKind == JsonValueKind.String)
            description = descProp.GetString() ?? "";
        else if (descProp.ValueKind == JsonValueKind.Object &&
                 descProp.TryGetProperty("value", out var valueProp))
            description = valueProp.GetString() ?? "";
    }

    return new { description };
}
```

### Frontend

Create `mylib-client/src/components/BookModal.tsx`:

```typescript
interface BookModalProps {
  book: { key: string; title: string; authors: string[]; coverUrl?: string } | null;
  onClose: () => void;
}

export default function BookModal({ book, onClose }: BookModalProps) {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>
        {book.coverUrl && (
          <img src={book.coverUrl} alt={book.title} className="w-32 rounded-lg mb-4" />
        )}
        <p className="text-gray-500 text-sm">{book.authors.join(', ')}</p>
      </div>
    </div>
  );
}
```

In `SearchPage.tsx`, add a `selectedBook` state and render the modal:

```typescript
const [selectedBook, setSelectedBook] = useState<Book | null>(null);
// ...
<BookCard
  key={book.key}
  book={book}
  onClick={() => setSelectedBook(book)}
  // ...
/>
<BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
```

### What You'll Learn
- Modal overlay patterns using `fixed inset-0`
- `stopPropagation()` to prevent click-through
- Fetching detail data on demand

---

## Stretch Goal 3 — Dark Mode

### What to Build

A toggle button in the navbar that switches the entire app between light and dark mode, and remembers the preference.

### How Tailwind Dark Mode Works

Tailwind's dark mode uses the `dark` class on the `<html>` element. When `<html class="dark">` is set, all `dark:` prefixed utility classes activate.

### Implementation

1. Configure Tailwind to use class-based dark mode. In `mylib-client/src/index.css`, the `@import "tailwindcss"` already handles this.

2. Create a `ThemeContext.tsx`:
   ```typescript
   import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

   interface ThemeContextType {
     isDark: boolean;
     toggle: () => void;
   }

   const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

   export function ThemeProvider({ children }: { children: ReactNode }) {
     const [isDark, setIsDark] = useState(() => {
       return localStorage.getItem('mylib_theme') === 'dark';
     });

     useEffect(() => {
       document.documentElement.classList.toggle('dark', isDark);
       localStorage.setItem('mylib_theme', isDark ? 'dark' : 'light');
     }, [isDark]);

     return (
       <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((d) => !d) }}>
         {children}
       </ThemeContext.Provider>
     );
   }

   export const useTheme = () => {
     const ctx = useContext(ThemeContext);
     if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
     return ctx;
   };
   ```

3. Wrap `App.tsx` with `<ThemeProvider>`.

4. Add a toggle button to `Navbar.tsx`:
   ```typescript
   const { isDark, toggle } = useTheme();
   // ...
   <button onClick={toggle}>{isDark ? '☀️' : '🌙'}</button>
   ```

5. Add `dark:` variants to your components, for example:
   ```typescript
   className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
   ```

### What You'll Learn
- `document.documentElement.classList` — manipulating the root HTML element
- Tailwind dark mode (`dark:` prefix)
- Persisting UI preferences in localStorage
- Multiple React Contexts in the same app

---

## Stretch Goal 4 — Deploy

### What to Build

A publicly accessible version of MyLib:
- Backend deployed to **Azure App Service** (free tier)
- Frontend deployed to **Vercel**

### Backend → Azure App Service

**Prerequisites:**
- Install Azure CLI: `brew install azure-cli`
- Create a free Azure account at https://azure.microsoft.com

```bash
az login

cd MyLib.Api
dotnet publish -c Release -o ./publish

az webapp up \
  --name mylib-api \
  --resource-group mylib-rg \
  --runtime "DOTNET|10.0" \
  --sku F1
```

Update `appsettings.json` or set environment variables for production JWT key:

```bash
az webapp config appsettings set \
  --name mylib-api \
  --resource-group mylib-rg \
  --settings Jwt__Key="your-production-secret-key"
```

Update CORS in `Program.cs` to allow your Vercel domain:

```csharp
policy.WithOrigins("https://mylib.vercel.app", "http://localhost:5173")
```

### Frontend → Vercel

**Prerequisites:**
- Install Vercel CLI: `npm install -g vercel`
- Create a free Vercel account at https://vercel.com

Update `api.ts` to point to your Azure API in production:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});
```

Set `VITE_API_URL=https://mylib-api.azurewebsites.net/api` as an environment variable in the Vercel dashboard.

```bash
cd mylib-client
vercel
```

Follow the prompts. Your app will be live at a `*.vercel.app` URL.

### What You'll Learn
- Building for production (`dotnet publish`, `npm run build`)
- Environment variables in both .NET (`appsettings.json` overrides) and Vite (`import.meta.env`)
- Updating CORS for cross-domain production setup
- Deploying to Azure and Vercel free tiers

---

→ See **[Quick-Reference.md](Quick-Reference.md)** for a summary of all commands and patterns used throughout the project.
