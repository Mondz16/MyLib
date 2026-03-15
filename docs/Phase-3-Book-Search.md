# Phase 3 — Book Search

**Days 6–7**

---

## Navigation

← Previous: [Phase-2-Authentication.md](Phase-2-Authentication.md)  
→ Next: [Phase-4-Favorites.md](Phase-4-Favorites.md)

---

## What You'll Build

**Backend:**
- `OpenLibraryService` — a service class that calls the Open Library API
- `BooksController` — proxies search queries from React to Open Library

**Frontend:**
- `BookCard` component — displays cover, title, author
- `SearchPage` — search bar with debounced input and a responsive book grid

---

## Learning Goals

- The **API proxy pattern** — why the backend calls Open Library instead of the frontend doing it directly
- `HttpClient` in .NET — how to call external APIs from a service class
- `IHttpClientFactory` — the correct way to register typed `HttpClient` instances
- React `useCallback` — creating stable function references to avoid infinite re-renders
- **Debouncing** — delaying a search until the user stops typing (avoid spamming requests)
- Conditional rendering for loading, error, and empty states

---

## Concept: Why Use a Backend Proxy?

The React app could call `https://openlibrary.org/search.json` directly from the browser.  
But routing it through your own backend has advantages:

| Concern | Direct (Browser → Open Library) | Proxy (Browser → Your API → Open Library) |
|---|---|---|
| API key hiding | Key exposed in browser | Key stays on server |
| Response shaping | Raw messy JSON | Clean, typed response |
| Caching later | Hard | Easy to add |
| Rate limit control | No control | Can throttle |

You will always use the proxy pattern in real projects.

---

## Step 3.1 — Create the Open Library Service

Create the folder `MyLib.Api/Services/` and add `OpenLibraryService.cs`:

```csharp
using System.Text.Json;

namespace MyLib.Api.Services;

public class BookSearchResult
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = [];
    public string? CoverUrl { get; set; }
    public int? FirstPublishYear { get; set; }
}

public class BookSearchResponse
{
    public int TotalResults { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public List<BookSearchResult> Books { get; set; } = [];
}

public class OpenLibraryService
{
    private readonly HttpClient _httpClient;

    public OpenLibraryService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://openlibrary.org/");
    }

    public async Task<BookSearchResponse> SearchBooksAsync(string query, int page = 1, int limit = 20)
    {
        var url = $"search.json?q={Uri.EscapeDataString(query)}" +
                  $"&fields=key,title,author_name,cover_i,first_publish_year" +
                  $"&page={page}&limit={limit}";

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(json);
        var root = data.RootElement;

        var totalFound = root.GetProperty("numFound").GetInt32();
        var docs = root.GetProperty("docs");

        var books = new List<BookSearchResult>();
        foreach (var doc in docs.EnumerateArray())
        {
            var key = doc.TryGetProperty("key", out var keyProp)
                ? keyProp.GetString() ?? "" : "";

            var title = doc.TryGetProperty("title", out var titleProp)
                ? titleProp.GetString() ?? "Unknown Title" : "Unknown Title";

            var authors = new List<string>();
            if (doc.TryGetProperty("author_name", out var authorProp))
                foreach (var a in authorProp.EnumerateArray())
                    authors.Add(a.GetString() ?? "");

            string? coverUrl = null;
            if (doc.TryGetProperty("cover_i", out var coverProp))
                coverUrl = $"https://covers.openlibrary.org/b/id/{coverProp.GetInt32()}-M.jpg";

            int? year = null;
            if (doc.TryGetProperty("first_publish_year", out var yearProp))
                year = yearProp.GetInt32();

            books.Add(new BookSearchResult
            {
                Key = key,
                Title = title,
                Authors = authors,
                CoverUrl = coverUrl,
                FirstPublishYear = year
            });
        }

        return new BookSearchResponse
        {
            TotalResults = totalFound,
            Page = page,
            Limit = limit,
            Books = books
        };
    }
}
```

> **`JsonDocument.Parse`** reads raw JSON without needing a model that exactly matches the response structure. `TryGetProperty` safely handles missing fields — Open Library sometimes omits `cover_i` or `first_publish_year`.

---

## Step 3.2 — Register the Service in Program.cs

Open `MyLib.Api/Program.cs` and add this line **before** `builder.Build()`:

```csharp
builder.Services.AddHttpClient<OpenLibraryService>();
```

> **`AddHttpClient<T>()`** registers `OpenLibraryService` as a **typed client**. .NET manages the lifecycle of the underlying `HttpClient`, avoids socket exhaustion, and handles connection pooling automatically. Never use `new HttpClient()` directly in a service class.

---

## Step 3.3 — Create the BooksController

Create `MyLib.Api/Controllers/BooksController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using MyLib.Api.Services;

namespace MyLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly OpenLibraryService _openLibraryService;

    public BooksController(OpenLibraryService openLibraryService)
    {
        _openLibraryService = openLibraryService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Search query is required" });

        var results = await _openLibraryService.SearchBooksAsync(q, page, Math.Min(limit, 50));
        return Ok(results);
    }
}
```

**Test it** by visiting this URL in your browser (with the API running):

```
https://localhost:7001/api/books/search?q=harry+potter
```

You should see JSON with a list of books.

---

## Step 3.4 — Build the BookCard Component

Create `mylib-client/src/components/BookCard.tsx`:

```typescript
interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

interface BookCardProps {
  book: Book;
  isFavorited?: boolean;
  onToggleFavorite?: (book: Book) => void;
}

export default function BookCard({ book, isFavorited = false, onToggleFavorite }: BookCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[2/3] bg-gray-100 relative">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">📖</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">
          {book.authors.join(', ') || 'Unknown Author'}
        </p>
        {book.firstPublishYear && (
          <p className="text-xs text-gray-400 mt-1">{book.firstPublishYear}</p>
        )}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(book)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: isFavorited ? '#ef4444' : '#d1d5db',
              color: isFavorited ? '#ef4444' : '#6b7280',
              backgroundColor: isFavorited ? '#fef2f2' : 'transparent',
            }}
          >
            {isFavorited ? '❤️ Saved' : '🤍 Save'}
          </button>
        )}
      </div>
    </div>
  );
}
```

> **`onToggleFavorite?`** — the `?` makes this prop optional. When it is `undefined`, the favorite button is not rendered at all. This lets you reuse `BookCard` in both the Search page (with the button) and potentially a detail view (without).

---

## Step 3.5 — Build the Search Page

Create `mylib-client/src/pages/SearchPage.tsx`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import BookCard from '../components/BookCard';
import api from '../services/api';

interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const searchBooks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setBooks([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const response = await api.get('/books/search', { params: { q: searchQuery } });
      setBooks(response.data.books);
      setTotalResults(response.data.totalResults);
    } catch {
      setError('Failed to fetch books. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce: wait 500ms after the user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks(query);
    }, 500);
    return () => clearTimeout(timer); // Cleanup: cancel if query changes before 500ms
  }, [query, searchBooks]);

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Find Your Next Book
        </h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full border border-gray-300 rounded-xl px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Searching books...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">{error}</div>
      )}

      {!loading && hasSearched && books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">No books found for "{query}"</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-gray-400">Start typing to search millions of books</p>
        </div>
      )}

      {books.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Found {totalResults.toLocaleString()} results
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookCard key={book.key} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

> **Debounce explained:**
> Every time `query` changes, `useEffect` runs. It sets a 500ms timer. If `query` changes again before 500ms, the **cleanup function** (`clearTimeout`) cancels the previous timer. Only when the user pauses for 500ms does `searchBooks` actually fire.
>
> **`useCallback`** wraps `searchBooks` so its reference stays stable across renders. Without it, the `useEffect` would see a new `searchBooks` function every render and trigger an infinite loop.

---

## Step 3.6 — Add SearchPage to App.tsx

Open `mylib-client/src/App.tsx` and:

1. Import the component at the top:
   ```typescript
   import SearchPage from './pages/SearchPage';
   ```
2. Replace the placeholder route for `/`:
   ```typescript
   <Route path="/" element={<SearchPage />} />
   ```

---

## Checkpoint ✓

- [ ] Typing in the search bar shows book results after ~500ms
- [ ] Book cards show covers (or the 📖 fallback), title, and author
- [ ] The result count appears above the grid
- [ ] Clearing the search returns to the welcome state
- [ ] An empty state appears when no books match the query
- [ ] A loading spinner appears while the API is fetching

---

→ Continue to **[Phase-4-Favorites.md](Phase-4-Favorites.md)**
