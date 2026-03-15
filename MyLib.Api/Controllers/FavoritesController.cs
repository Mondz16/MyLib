using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyLib.Api.Data;
using MyLib.Api.Models;

namespace MyLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{   
    private readonly AppDbContext _appDbContext;

    public FavoritesController(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetFavorites()
    {
        var userId = GetUserId();
        var favorites = await _appDbContext.Favorites
            .Where(f => f.UserId == userId)
            .OrderByDescending(order => order.SavedAt)
            .ToListAsync();

        return Ok(favorites);
    }

    [HttpPost]
    public async Task<IActionResult> AddFavorite([FromBody] Favorite favorite)
    {
        var userId = GetUserId();
        var exists = await _appDbContext.Favorites
                .AnyAsync(f => f.UserId == userId && f.OpenLibraryKey == favorite.OpenLibraryKey);

        if(exists)
            return Conflict(new {message = "Book already exists in favorite!"});
        
        favorite.UserId = userId;
        favorite.SavedAt = DateTime.UtcNow;

        _appDbContext.Favorites.Add(favorite);
        await _appDbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFavorites), favorite);
    }

    [HttpDelete("{openLibraryKey}")]
    public async Task<IActionResult> RemoveFavorite(string openLibraryKey)
    {
        var userId = GetUserId();
        var decodedKey = Uri.UnescapeDataString(openLibraryKey);

        var favorite = await _appDbContext.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.OpenLibraryKey == decodedKey);

        if(favorite == null)
            return NotFound(new {message = "Favorite not found!"});

        _appDbContext.Remove(favorite);
        await _appDbContext.SaveChangesAsync();

        return NoContent();
    }

}
