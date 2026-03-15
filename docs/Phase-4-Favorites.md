# Phase 4 — Favorites

**Days 8–10**

---

## Navigation

← Previous: [Phase-3-Book-Search.md](Phase-3-Book-Search.md)  
→ Next: [Phase-5-Polish.md](Phase-5-Polish.md)

---

## What You'll Build

**Backend:**
- `FavoritesController` with `GET`, `POST`, and `DELETE` endpoints
- All endpoints protected by `[Authorize]` — only authenticated users can access them
- The user's ID is read directly from their JWT token claims

**Frontend:**
- `useFavorites` custom hook — handles loading, adding, and removing favorites
- Heart toggle button on each `BookCard`
- `FavoritesPage` showing all saved books

---

## Learning Goals

- `[Authorize]` attribute and JWT claim extraction in .NET
- EF Core: querying, inserting, and deleting records
- React **custom hooks** — extracting reusable stateful logic
- **State lifting** — sharing state between the Search page and Favorites page
- Optimistic UI updates — updating the UI immediately before the server confirms

---

## Concept: How Protected Endpoints Work

When a request hits a `[Authorize]` endpoint:

```
Request arrives with header:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
          ↓
.NET JWT middleware validates:
  - Is the token signature valid? (matches our secret key)
  - Has the token expired?
  - Does issuer and audience match?
          ↓
If valid → request continues to controller
If invalid → 401 Unauthorized returned immediately
          ↓
Inside the controller:
  User.FindFirstValue(ClaimTypes.NameIdentifier)
  → returns the user's ID that was embedded in the token at login time
```

---

## Step 4.1 — Create the FavoritesController

Create `MyLib.Api/Controllers/FavoritesController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyLib.Api.Data;
using MyLib.Api.Models;
using System.Security.Claims;

namespace MyLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FavoritesController(AppDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetFavorites()
    {
        var userId = GetUserId();
        var favorites = await _context.Favorites
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.SavedAt)
            .ToListAsync();
        return Ok(favorites);
    }

    [HttpPost]
    public async Task<IActionResult> AddFavorite([FromBody] Favorite favorite)
    {
        var userId = GetUserId();

        var exists = await _context.Favorites
            .AnyAsync(f => f.UserId == userId && f.OpenLibraryKey == favorite.OpenLibraryKey);

        if (exists)
            return Conflict(new { message = "Book is already in your favorites" });

        favorite.UserId = userId;
        favorite.SavedAt = DateTime.UtcNow;

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFavorites), favorite);
    }

    [HttpDelete("{openLibraryKey}")]
    public async Task<IActionResult> RemoveFavorite(string openLibraryKey)
    {
        var userId = GetUserId();
        var decodedKey = Uri.UnescapeDataString(openLibraryKey);

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.OpenLibraryKey == decodedKey);

        if (favorite == null)
            return NotFound(new { message = "Favorite not found" });

        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
```

> **Key EF Core methods used:**
> - `Where(f => f.UserId == userId)` — SQL `WHERE` clause
> - `.ToListAsync()` — executes the query and returns results
> - `.AnyAsync(...)` — SQL `EXISTS` check
> - `_context.Favorites.Add(favorite)` — marks the entity for insertion
> - `_context.Favorites.Remove(favorite)` — marks the entity for deletion
> - `await _context.SaveChangesAsync()` — commits all pending changes to the database
>
> **`Uri.UnescapeDataString`** handles the `/` in Open Library keys like `/works/OL45883W`. Since `/` is a URL path separator, it gets encoded as `%2F` when sent in the route — this decodes it back.

---

## Step 4.2 — Test the Favorites Endpoints

Restart the API:

```bash
cd MyLib.Api && dotnet run
```

Open Swagger at `https://localhost:7001/swagger`.

1. Login via `POST /api/auth/login` and copy the `token` from the response.
2. Click the **Authorize** button at the top of Swagger, paste `Bearer <your-token>`, and click Authorize.
3. Test `POST /api/favorites` with a body like:
   ```json
   {
     "openLibraryKey": "/works/OL45883W",
     "title": "The Lord of the Rings",
     "author": "J.R.R. Tolkien",
     "coverUrl": "https://covers.openlibrary.org/b/id/9255566-M.jpg"
   }
   ```
4. Test `GET /api/favorites` — you should see the book you just added.
5. Test `DELETE /api/favorites/%2Fworks%2FOL45883W` — book removed.

---

## Step 4.3 — Create the useFavorites Custom Hook

Create the folder `mylib-client/src/hooks/` and add `useFavorites.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

interface Favorite {
  id: number;
  openLibraryKey: string;
  title: string;
  author: string;
  coverUrl: string;
  savedAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/favorites');
      setFavorites(response.data);
      setFavoriteKeys(new Set(response.data.map((f: Favorite) => f.openLibraryKey)));
    } catch {
      // Silently fail — not critical if this doesn't load
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (book: Book) => {
    if (!isAuthenticated) return;

    const isFav = favoriteKeys.has(book.key);

    if (isFav) {
      // Remove
      const encodedKey = encodeURIComponent(book.key);
      await api.delete(`/favorites/${encodedKey}`);
      setFavoriteKeys((prev) => {
        const next = new Set(prev);
        next.delete(book.key);
        return next;
      });
      setFavorites((prev) => prev.filter((f) => f.openLibraryKey !== book.key));
    } else {
      // Add
      const response = await api.post('/favorites', {
        openLibraryKey: book.key,
        title: book.title,
        author: book.authors.join(', '),
        coverUrl: book.coverUrl ?? '',
      });
      setFavorites((prev) => [...prev, response.data]);
      setFavoriteKeys((prev) => new Set([...prev, book.key]));
    }
  };

  return { favorites, favoriteKeys, toggleFavorite, loadFavorites };
}
```

> **Why a custom hook?**
> Both `SearchPage` and `FavoritesPage` need to know which books are favorited. Instead of duplicating the logic in both components, the hook lets both call `useFavorites()` and share the same behavior.
>
> **`Set<string>` for `favoriteKeys`** — checking `favoriteKeys.has(book.key)` is O(1) (instant), while searching an array with `.find()` would be O(n) (slower as favorites grow).

---

## Step 4.4 — Connect Favorites to the Search Page

Open `mylib-client/src/pages/SearchPage.tsx` and make these changes:

1. Add the imports at the top:
   ```typescript
   import { useFavorites } from '../hooks/useFavorites';
   import { useAuth } from '../context/AuthContext';
   import { useNavigate } from 'react-router-dom';
   ```

2. Inside the `SearchPage` component, add these hooks after the existing `useState` declarations:
   ```typescript
   const { favoriteKeys, toggleFavorite } = useFavorites();
   const { isAuthenticated } = useAuth();
   const navigate = useNavigate();
   ```

3. Add a handler for guests who try to favorite without logging in:
   ```typescript
   const handleFavoriteAttempt = (book: Book) => {
     if (!isAuthenticated) {
       navigate('/login');
       return;
     }
     toggleFavorite(book);
   };
   ```

4. Update the `BookCard` in the results grid to pass favorite state:
   ```typescript
   <BookCard
     key={book.key}
     book={book}
     isFavorited={favoriteKeys.has(book.key)}
     onToggleFavorite={handleFavoriteAttempt}
   />
   ```

---

## Step 4.5 — Build the Favorites Page

Create `mylib-client/src/pages/FavoritesPage.tsx`:

```typescript
import { useFavorites } from '../hooks/useFavorites';
import BookCard from '../components/BookCard';

export default function FavoritesPage() {
  const { favorites, favoriteKeys, toggleFavorite } = useFavorites();

  const booksFromFavorites = favorites.map((f) => ({
    key: f.openLibraryKey,
    title: f.title,
    authors: [f.author],
    coverUrl: f.coverUrl || undefined,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🤍</p>
          <p className="text-gray-500 text-lg">You haven't saved any books yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Search for books and click the heart icon to save them here
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {favorites.length} saved {favorites.length === 1 ? 'book' : 'books'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {booksFromFavorites.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                isFavorited={favoriteKeys.has(book.key)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Step 4.6 — Add FavoritesPage to App.tsx

Open `mylib-client/src/App.tsx`:

1. Import the page:
   ```typescript
   import FavoritesPage from './pages/FavoritesPage';
   ```

2. Replace the placeholder favorites route:
   ```typescript
   <Route
     path="/favorites"
     element={
       <ProtectedRoute>
         <FavoritesPage />
       </ProtectedRoute>
     }
   />
   ```

---

## Checkpoint ✓

- [ ] Search for a book and click "Save" — the button turns red and shows "❤️ Saved"
- [ ] Refresh the page — the book is still marked as saved
- [ ] Navigate to `/favorites` — you can see all your saved books
- [ ] Click "❤️ Saved" on a book — it is removed from both the grid and the database
- [ ] Visiting `/favorites` while logged out redirects to `/login`
- [ ] A guest clicking "Save" on a search result is redirected to `/login`

---

→ Continue to **[Phase-5-Polish.md](Phase-5-Polish.md)**
