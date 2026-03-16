using System;
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
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new {message = "Search query is required"});

        var results = await _openLibraryService.SearchBookAsync(q, page, Math.Min(limit, 50));
        return Ok(results);
    }

    [HttpGet("{olid}")]
    public async Task<IActionResult> GetBook(string olid)
    {
        var result = await _openLibraryService.GetBookDetailsAsync(olid);
        if(result == null) return NotFound();
        return Ok(result);
    }
}
