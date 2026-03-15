# MyLib — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** March 15, 2026  
**Author:** MyLib Team  
**Status:** Approved

---

## 1. Product Overview

| Field | Detail |
|---|---|
| **Product Name** | MyLib |
| **Type** | Full-stack web application |
| **Purpose** | A personal library manager that lets users search for books, discover new reads, and maintain a personalized favorites list |
| **Target Users** | Individual readers who want a simple, clean way to track and explore books |

### Vision Statement

MyLib gives every reader their own digital bookshelf — powered by the Open Library database — where they can search millions of books and curate a personal collection of favorites.

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Frontend** | React | 19 | Component-based UI |
| **Frontend Router** | React Router | v7 | Client-side routing |
| **Frontend HTTP** | Axios | latest | API calls |
| **Frontend Styles** | TailwindCSS | v4 | Utility-first CSS |
| **Backend** | ASP.NET Core Web API | .NET 10 | RESTful API |
| **Auth** | ASP.NET Core Identity + JWT | .NET 10 | Combined auth approach |
| **ORM** | Entity Framework Core | 10 | Database access layer |
| **Database** | SQLite | 3 | Lightweight, file-based |
| **External API** | Open Library API | — | Free, no API key required |
| **Language (FE)** | TypeScript | 5 | Type-safe React |
| **Language (BE)** | C# | 14 | .NET 10 default |

---

## 3. Features & User Stories

### 3.1 User Authentication

| ID | Feature | User Story | Priority |
|---|---|---|---|
| AUTH-01 | Register | As a new user, I can create an account with my email and password so that I can access personalized features | High |
| AUTH-02 | Login | As a registered user, I can log in with my credentials and receive a JWT token so that I stay authenticated across sessions | High |
| AUTH-03 | Logout | As a logged-in user, I can log out so that my session is cleared and my account is secure | High |
| AUTH-04 | Protected Routes | As a user, I am redirected to the login page when I try to access a protected page without being authenticated | High |

### 3.2 Book Search

| ID | Feature | User Story | Priority |
|---|---|---|---|
| BOOK-01 | Search Bar | As a user, I can type a book title or author name into a search bar and see relevant results | High |
| BOOK-02 | Search Results | As a user, I can view a grid of book cards showing the cover image, title, and author name | High |
| BOOK-03 | Debounced Search | As a user, the search fires automatically after I stop typing, without spamming requests | Medium |
| BOOK-04 | Empty State | As a user, I see a helpful message when no results are found | Medium |
| BOOK-05 | Loading State | As a user, I see a loading indicator while results are being fetched | Medium |

### 3.3 Favorites

| ID | Feature | User Story | Priority |
|---|---|---|---|
| FAV-01 | Add Favorite | As a logged-in user, I can click a heart icon on a book card to save it to my favorites | High |
| FAV-02 | Remove Favorite | As a logged-in user, I can click the heart icon again to remove a book from my favorites | High |
| FAV-03 | View Favorites | As a logged-in user, I can navigate to a dedicated Favorites page to see all my saved books | High |
| FAV-04 | Favorite Indicator | As a user, I can immediately see which books in search results I have already favorited | Medium |
| FAV-05 | Auth Guard on Favorites | As a guest user, I am prompted to log in when I try to add a book to my favorites | Medium |

---

## 4. API Specification

### Base URL
- Development: `https://localhost:7001/api`
- Frontend Dev Server: `http://localhost:5173`

### 4.1 Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "bookworm42"
}
```

**Response `201 Created`:**
```json
{
  "message": "Registration successful"
}
```

**Response `400 Bad Request`:** Validation errors or email already taken.

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2026-03-16T10:00:00Z",
  "user": {
    "id": "abc-123",
    "email": "user@example.com",
    "username": "bookworm42"
  }
}
```

**Response `401 Unauthorized`:** Invalid credentials.

---

#### `POST /api/auth/logout`
Logout (client-side only — token is discarded by the frontend).

**Response `200 OK`:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 4.2 Books Endpoints

#### `GET /api/books/search?q={query}&page={page}&limit={limit}`
Search books via Open Library. The backend proxies this call to shield the external API and shape the response.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `q` | string | Yes | — | Search term (title or author) |
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Results per page (max 50) |

**Response `200 OK`:**
```json
{
  "totalResults": 1342,
  "page": 1,
  "limit": 20,
  "books": [
    {
      "key": "/works/OL45883W",
      "title": "The Lord of the Rings",
      "authors": ["J.R.R. Tolkien"],
      "coverUrl": "https://covers.openlibrary.org/b/id/9255566-M.jpg",
      "firstPublishYear": 1954
    }
  ]
}
```

---

#### `GET /api/books/{olid}`
Get details of a single book by its Open Library work key (e.g. `OL45883W`).

**Response `200 OK`:**
```json
{
  "key": "/works/OL45883W",
  "title": "The Lord of the Rings",
  "authors": ["J.R.R. Tolkien"],
  "coverUrl": "https://covers.openlibrary.org/b/id/9255566-M.jpg",
  "description": "An epic high-fantasy novel...",
  "firstPublishYear": 1954,
  "subjects": ["Fantasy", "Adventure"]
}
```

---

### 4.3 Favorites Endpoints

> All favorites endpoints require `Authorization: Bearer <token>` header.

#### `GET /api/favorites`
Get the current user's favorited books.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "openLibraryKey": "/works/OL45883W",
    "title": "The Lord of the Rings",
    "author": "J.R.R. Tolkien",
    "coverUrl": "https://covers.openlibrary.org/b/id/9255566-M.jpg",
    "savedAt": "2026-03-15T08:30:00Z"
  }
]
```

---

#### `POST /api/favorites`
Add a book to the current user's favorites.

**Request Body:**
```json
{
  "openLibraryKey": "/works/OL45883W",
  "title": "The Lord of the Rings",
  "author": "J.R.R. Tolkien",
  "coverUrl": "https://covers.openlibrary.org/b/id/9255566-M.jpg"
}
```

**Response `201 Created`:** The newly created favorite object.

**Response `409 Conflict`:** Book already in favorites.

---

#### `DELETE /api/favorites/{olid}`
Remove a book from favorites by its Open Library key.

**Response `204 No Content`:** Successfully removed.

**Response `404 Not Found`:** Book not in user's favorites.

---

## 5. Data Models

### 5.1 User (ASP.NET Core Identity)

Extends `IdentityUser` — no custom fields required for MVP.

| Field | Type | Notes |
|---|---|---|
| Id | string (GUID) | Auto-generated |
| Email | string | Unique, required |
| UserName | string | Unique, required |
| PasswordHash | string | Managed by Identity |
| CreatedAt | DateTime | Custom field |

### 5.2 Favorite

| Field | Type | Notes |
|---|---|---|
| Id | int | Auto-increment PK |
| UserId | string | FK to User.Id |
| OpenLibraryKey | string | e.g. `/works/OL45883W` |
| Title | string | Cached from Open Library |
| Author | string | Cached from Open Library |
| CoverUrl | string | Cached from Open Library |
| SavedAt | DateTime | UTC timestamp |

**Constraint:** Unique index on `(UserId, OpenLibraryKey)` to prevent duplicates.

---

## 6. Open Library API Integration

| Use Case | Endpoint |
|---|---|
| Search books | `GET https://openlibrary.org/search.json?q={query}&fields=key,title,author_name,cover_i,first_publish_year&limit=20` |
| Get book details | `GET https://openlibrary.org/works/{olid}.json` |
| Get book cover | `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg` (M = medium) |
| Fallback cover | Use a local placeholder image when `cover_i` is null |

**Notes:**
- No API key required.
- Rate limit: Polite use — do not hammer the API. The debounce on the frontend helps.
- The backend proxies all Open Library requests so the frontend never calls Open Library directly.

---

## 7. Frontend Pages & Components

### 7.1 Pages

| Page | Route | Auth Required | Description |
|---|---|---|---|
| Home / Search | `/` | No | Search bar + results grid |
| Login | `/login` | No (redirect if authed) | Login form |
| Register | `/register` | No (redirect if authed) | Registration form |
| Favorites | `/favorites` | Yes | User's saved books |

### 7.2 Key Components

| Component | Description |
|---|---|
| `Navbar` | Top navigation with logo, search link, favorites link, login/logout |
| `BookCard` | Displays cover, title, author, heart toggle button |
| `SearchBar` | Controlled input with debounce |
| `ProtectedRoute` | HOC that redirects unauthenticated users to `/login` |
| `AuthContext` | React Context providing `user`, `token`, `login()`, `logout()` |
| `LoadingSpinner` | Reusable loading indicator |
| `EmptyState` | Reusable empty/no-results message |

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Browser (React App)                │
│                                                     │
│  SearchPage → Axios → /api/books/search             │
│  FavoritesPage → Axios → /api/favorites             │
│  LoginPage → Axios → /api/auth/login → store JWT   │
└────────────────────────┬────────────────────────────┘
                         │ HTTP (JWT in header)
                         ▼
┌─────────────────────────────────────────────────────┐
│           .NET 10 Web API (MyLib.Api)               │
│                                                     │
│  AuthController → ASP.NET Core Identity + JWT      │
│  BooksController → HttpClient → Open Library API   │
│  FavoritesController → EF Core → SQLite DB         │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   SQLite DB      │
              │  (mylib.db)      │
              │  Users table     │
              │  Favorites table │
              └──────────────────┘
```

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Search results load within 2 seconds on a standard connection |
| **Security** | Passwords hashed by ASP.NET Core Identity (PBKDF2); JWT signed with HS256; tokens expire in 24 hours |
| **Usability** | Fully responsive layout (mobile, tablet, desktop) |
| **Accessibility** | Semantic HTML; keyboard-navigable forms |
| **Error Handling** | All API errors return structured JSON; UI shows user-friendly messages |

---

## 10. Out of Scope (v1.0)

- Social features (sharing favorites, following users)
- Reading progress tracking
- Book reviews or ratings
- Email verification
- Password reset flow
- Notifications
- Mobile native app
