# Phase 2 — Authentication

**Days 3–5**

---

## Navigation

← Previous: [Phase-1-Project-Setup.md](Phase-1-Project-Setup.md)  
→ Next: [Phase-3-Book-Search.md](Phase-3-Book-Search.md)

---

## What You'll Build

**Backend:**
- JWT configuration in `appsettings.json`
- `AuthController` with `/register`, `/login`, and `/logout` endpoints
- Token generation using `JwtSecurityToken`

**Frontend:**
- `AuthContext` — global state for the logged-in user
- `api.ts` — Axios instance with automatic JWT header injection
- `LoginPage` and `RegisterPage` with controlled forms
- `Navbar` component showing different links based on auth state
- `ProtectedRoute` component that guards pages from unauthenticated users
- Full routing wired up in `App.tsx`

---

## Learning Goals

- How JWT authentication works end-to-end (create token → store in browser → send in header → validate on server)
- React `useState` — managing local component state
- React `useEffect` — running side effects (restoring session on page load)
- React Context API — sharing global state without prop drilling
- Controlled form inputs in React

---

## Concept: How JWT Authentication Works

```
1. User submits login form
        ↓
2. POST /api/auth/login  (email + password in request body)
        ↓
3. Backend verifies credentials with ASP.NET Core Identity
        ↓
4. Backend generates a signed JWT token and returns it
        ↓
5. Frontend stores the token in localStorage
        ↓
6. Every subsequent API request includes:
   Authorization: Bearer <token>
        ↓
7. Backend validates the token signature and expiry on [Authorize] endpoints
        ↓
8. Backend reads the user's ID from the token claims
```

The token is a self-contained string — the backend does not store sessions. This is called **stateless authentication**.

---

## Step 2.1 — Add JWT Configuration to appsettings.json

Open `MyLib.Api/appsettings.json` and add the `"Jwt"` block:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Jwt": {
    "Key": "your-super-secret-key-at-least-32-characters-long",
    "Issuer": "MyLibApi",
    "Audience": "MyLibClient",
    "ExpirationHours": 24
  }
}
```

> **Security Note:** Never commit real secret keys to version control. For learning, this is fine. In production, use environment variables or the .NET Secret Manager (`dotnet user-secrets`).

---

## Step 2.2 — Update Program.cs to Add JWT

Open `MyLib.Api/Program.cs`. Add these `using` statements at the top:

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
```

Then add the JWT authentication block **after the Identity setup** and **before `AddCors`**:

```csharp
// Read JWT settings
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

// Configure JWT bearer authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
```

> **`builder.Configuration["Jwt:Key"]`** reads from `appsettings.json`. The `!` asserts the value is not null (tell the compiler you're sure it exists).

---

## Step 2.3 — Create the DTOs

DTOs (Data Transfer Objects) define the shape of data sent between client and server.

Create the folder `MyLib.Api/Models/DTOs/` and add these three files:

**`MyLib.Api/Models/DTOs/RegisterDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace MyLib.Api.Models.DTOs;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Username { get; set; } = string.Empty;
}
```

**`MyLib.Api/Models/DTOs/LoginDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace MyLib.Api.Models.DTOs;

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
```

**`MyLib.Api/Models/DTOs/AuthResponseDto.cs`**

```csharp
namespace MyLib.Api.Models.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}
```

> **Why DTOs?** They let you control exactly what data is exposed. You would never send the full `ApplicationUser` object (which includes the password hash) back to the client.

---

## Step 2.4 — Create AuthController

Create `MyLib.Api/Controllers/AuthController.cs`:

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MyLib.Api.Models;
using MyLib.Api.Models.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MyLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            Email = dto.Email,
            UserName = dto.Username
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return StatusCode(201, new { message = "Registration successful" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials" });

        var token = GenerateJwtToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Expiration = DateTime.UtcNow.AddHours(
                int.Parse(_configuration["Jwt:ExpirationHours"]!)),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Username = user.UserName!
            }
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // JWT is stateless — logout is handled client-side by discarding the token
        return Ok(new { message = "Logged out successfully" });
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(
                int.Parse(_configuration["Jwt:ExpirationHours"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

> **`UserManager` vs `SignInManager`:**
> - `UserManager<T>` — CRUD for users: create, find, update, delete
> - `SignInManager<T>` — handles sign-in logic: check passwords, manage cookies
> Both are registered automatically by `AddIdentity()` in `Program.cs`.

---

## Step 2.5 — Test the Auth Endpoints in Swagger

Restart the API and open Swagger:

```bash
cd MyLib.Api
dotnet run
```

Navigate to `https://localhost:7001/swagger`.

1. **Test Register:** Expand `POST /api/auth/register`, click "Try it out", and submit:
   ```json
   {
     "email": "test@example.com",
     "password": "Password123",
     "username": "testuser"
   }
   ```
   You should get a `201 Created` response.

2. **Test Login:** Expand `POST /api/auth/login` and submit the same email/password.
   You should get a `200 OK` with a `token` field. Copy that token — you'll use it later.

---

## Step 2.6 — Create the API Service (Frontend)

Create `mylib-client/src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7001/api',
});

// Automatically attach the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mylib_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

> **Axios Interceptors** run before every request. This is how you avoid writing `Authorization: Bearer ...` manually on every single API call. One place to change, all calls updated.

---

## Step 2.7 — Create the AuthContext

Create `mylib-client/src/context/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session from localStorage when the app first loads
  useEffect(() => {
    const savedToken = localStorage.getItem('mylib_token');
    const savedUser = localStorage.getItem('mylib_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []); // Empty array = run once on mount

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mylib_token', newToken);
    localStorage.setItem('mylib_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mylib_token');
    localStorage.removeItem('mylib_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

> **React Context explained:**
> Without Context, you'd have to pass `user` and `logout` as props from `App` → `Navbar` → every child. With Context, any component calls `useAuth()` and gets the values directly.
>
> The `useEffect` with `[]` runs once when the component mounts (like `componentDidMount` in class components). It restores the session from `localStorage` so the user stays logged in after a page refresh.

---

## Step 2.8 — Create the Login Page

Create `mylib-client/src/pages/LoginPage.tsx`:

```typescript
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload on form submit
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome back</h1>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
```

> **Controlled Inputs:** `value={email}` and `onChange={(e) => setEmail(e.target.value)}` make React the "source of truth" for the input's value. The DOM does not own the data — React does. This is called a **controlled component**.

---

## Step 2.9 — Create the Register Page

Create `mylib-client/src/pages/RegisterPage.tsx`:

```typescript
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password, username });
      navigate('/login');
    } catch (err: any) {
      const errors = err.response?.data;
      if (Array.isArray(errors)) {
        setError(errors.map((e: any) => e.description).join(' '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create your account</h1>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-gray-400 font-normal">(min. 8 characters)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
```

---

## Step 2.10 — Create the Navbar

Create `mylib-client/src/components/Navbar.tsx`:

```typescript
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-blue-600">
        📚 MyLib
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
          Search
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/favorites" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
              Favorites
            </Link>
            <span className="text-sm text-gray-500">Hi, {user?.username}</span>
            <button
              onClick={logout}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

> `{isAuthenticated ? (...) : (...)}` is **conditional rendering** — JSX rendered by the ternary operator. The Navbar shows different links depending on whether the user is logged in.

---

## Step 2.11 — Create ProtectedRoute

Create `mylib-client/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

> If the user is not authenticated, they are redirected to `/login` automatically. Wrap any page that requires login with `<ProtectedRoute>`.

---

## Step 2.12 — Wire Up Routing in App.tsx

Replace `mylib-client/src/App.tsx` with:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <div className="text-center text-gray-500 py-12">
                    Search page — coming in Phase 3
                  </div>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <div className="text-center text-gray-500 py-12">
                      Favorites page — coming in Phase 4
                    </div>
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

> **Provider nesting:** `AuthProvider` wraps `BrowserRouter` so that router hooks (`useNavigate`, `Link`) and auth hooks (`useAuth`) are available to all children.

---

## Checkpoint ✓

- [ ] Register a new user via the React form at `/register`
- [ ] Login at `/login` — the navbar changes to show your username and a Logout button
- [ ] Logout — the navbar switches back to Login/Register links
- [ ] Refreshing the page keeps you logged in (session restored from localStorage)
- [ ] Visiting `/favorites` while logged out redirects you to `/login`

---

→ Continue to **[Phase-3-Book-Search.md](Phase-3-Book-Search.md)**
