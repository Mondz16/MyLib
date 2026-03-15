# Phase 1 — Project Setup

**Days 1–2**

---

## Navigation

← Previous: [Phase-0-Prerequisites.md](Phase-0-Prerequisites.md)  
→ Next: [Phase-2-Authentication.md](Phase-2-Authentication.md)

---

## What You'll Build

By the end of this phase you will have:
- A `.NET 10 Web API` project running at `https://localhost:7001` with Swagger UI
- A `React + TypeScript` app running at `http://localhost:5173`
- A SQLite database file created and migrated
- CORS configured so React can call the .NET API

---

## Learning Goals

- Understand the structure of a .NET Web API project (`.csproj`, `Program.cs`, `Controllers/`)
- Understand how React projects are structured (`src/`, `public/`, `package.json`)
- Know what CORS is and why it's required for local development
- Know what Entity Framework Core migrations are and how to run them

---

## Step 1.1 — Create the Solution

Open your terminal and navigate to the project workspace:

```bash
cd ~/Documents/WebProjects-\ \(.Net\)/Library
```

Create a solution file to group both projects under one roof:

```bash
dotnet new sln -n MyLib
```

> **What is a `.sln` file?** A solution file is a container that groups multiple related projects. It lets VS Code and Visual Studio open both `MyLib.Api` and `mylib-client` as one workspace.

---

## Step 1.2 — Scaffold the .NET Web API

```bash
dotnet new webapi -n MyLib.Api --use-controllers
cd MyLib.Api
dotnet sln ../MyLib.sln add MyLib.Api.csproj
cd ..
```

> **`--use-controllers`** gives you a traditional `Controllers/` folder instead of Minimal APIs. Traditional controllers are easier to learn and more widely documented.

Open `MyLib.Api/Program.cs` and read through it. Identify these key parts:

| Line | What it does |
|---|---|
| `var builder = WebApplication.CreateBuilder(args)` | Creates the app builder (service container) |
| `builder.Services.Add...()` | Registers services (dependency injection) |
| `var app = builder.Build()` | Builds the app pipeline |
| `app.Use...()` | Adds middleware (runs on every request) |
| `app.MapControllers()` | Routes HTTP requests to controller methods |

---

## Step 1.3 — Install Backend NuGet Packages

```bash
cd MyLib.Api

# Entity Framework Core for SQLite
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design

# ASP.NET Core Identity (user management)
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore

# JWT Authentication
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

cd ..
```

Install the EF Core CLI tool globally (only needed once per machine):

```bash
dotnet tool install --global dotnet-ef
```

Verify it works:

```bash
dotnet ef --version
```

> **What is NuGet?** NuGet is .NET's package manager, equivalent to npm for Node. Packages are downloaded from nuget.org and added to your `.csproj` file.

---

## Step 1.4 — Create the Data Models

Create the folder `MyLib.Api/Models/` and add the following files.

**`MyLib.Api/Models/ApplicationUser.cs`**

```csharp
using Microsoft.AspNetCore.Identity;

namespace MyLib.Api.Models;

public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

> `ApplicationUser` extends `IdentityUser`, which already has `Id`, `Email`, `UserName`, and `PasswordHash`. You add any extra fields here.

**`MyLib.Api/Models/Favorite.cs`**

```csharp
namespace MyLib.Api.Models;

public class Favorite
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string OpenLibraryKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
}
```

> `public ApplicationUser? User { get; set; }` is a **navigation property** — EF Core uses it to understand the relationship between `Favorite` and `ApplicationUser`.

---

## Step 1.5 — Create the Database Context

Create the folder `MyLib.Api/Data/` and add `AppDbContext.cs`:

**`MyLib.Api/Data/AppDbContext.cs`**

```csharp
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyLib.Api.Models;

namespace MyLib.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Favorite> Favorites { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.OpenLibraryKey })
            .IsUnique();
    }
}
```

> **Key Concepts:**
> - `IdentityDbContext<ApplicationUser>` — extends the base context with all Identity tables (AspNetUsers, AspNetRoles, etc.)
> - `DbSet<Favorite>` — tells EF Core to create a `Favorites` table
> - The unique index prevents a user from saving the same book twice

---

## Step 1.6 — Configure Program.cs

Replace the entire contents of `MyLib.Api/Program.cs`:

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyLib.Api.Data;
using MyLib.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Register the database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=mylib.db"));

// Register ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Allow the React dev server to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

> **Why does middleware order matter?** `UseCors` must come before `UseAuthentication`, and both must come before `UseAuthorization`. The pipeline runs top to bottom on every request.

---

## Step 1.7 — Run the Database Migration

```bash
cd MyLib.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
cd ..
```

After running these commands:
- A `Migrations/` folder appears containing C# code that describes your schema
- A `mylib.db` file is created in `MyLib.Api/` — this is your SQLite database

To verify the database was created:

```bash
ls MyLib.Api/mylib.db    # should print the file path
```

> **What is a migration?** EF Core reads your `AppDbContext` and model classes, then generates SQL to create the matching database tables. Each migration is versioned, so you can evolve the schema over time.

---

## Step 1.8 — Scaffold the React Frontend

Navigate back to the project root:

```bash
cd ~/Documents/WebProjects-\ \(.Net\)/Library
```

Create the Vite + React + TypeScript project:

```bash
npm create vite@latest mylib-client -- --template react-ts
cd mylib-client
npm install
```

Install the frontend dependencies:

```bash
npm install axios react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

> **Why these packages?**
> - `axios` — HTTP client for calling the backend API
> - `react-router-dom` — client-side routing (navigating between pages without reloading)
> - `tailwindcss` — utility-first CSS framework for styling

---

## Step 1.9 — Configure Tailwind CSS

Open `mylib-client/vite.config.ts` and replace its contents:

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
  },
})
```

Open `mylib-client/src/index.css` and replace all its content with:

```css
@import "tailwindcss";
```

---

## Step 1.10 — Test Both Apps Are Running

Open **two terminal windows** side by side.

**Terminal 1 — Backend:**

```bash
cd MyLib.Api
dotnet run
```

Look for a line like: `Now listening on: https://localhost:7001`

Open `https://localhost:7001/swagger` in your browser — you should see the Swagger UI.

**Terminal 2 — Frontend:**

```bash
cd mylib-client
npm run dev
```

Open `http://localhost:5173` — you should see the Vite + React starter page.

> **Tip:** Keep both terminals running. You'll need them open together throughout the project.

---

## Checkpoint ✓

Before moving to Phase 2, confirm all of these:

- [ ] `dotnet run` starts without errors in `MyLib.Api/`
- [ ] Swagger UI loads at `https://localhost:7001/swagger`
- [ ] `npm run dev` starts the React app at `http://localhost:5173`
- [ ] `mylib.db` file exists inside `MyLib.Api/`
- [ ] A `Migrations/` folder exists inside `MyLib.Api/`

---

→ Continue to **[Phase-2-Authentication.md](Phase-2-Authentication.md)**
