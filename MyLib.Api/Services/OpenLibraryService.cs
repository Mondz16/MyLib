using System;
using System.Text.Json;

namespace MyLib.Api.Services;

public class BookSearchResult
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<string> Authors {get;set;} = [];
    public string? CoverUrl { get; set; }
    public int? FirstPublishYear { get; set; }
}

public class BookSearchResponse
{
    public int TotalResult { get; set; }
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

    public async Task<BookSearchResponse> SearchBookAsync(string query, int page = 1, int limit = 20)
    {
        var url = $"search.json?q={Uri.EscapeDataString(query)}"+
                  $"&fields=key,title,author_name,cover_i,first_publish_year"+
                  $"&page={page}&limit={limit}";
        
        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(json);
        var root = data.RootElement;

        var totalFind = root.GetProperty("numFound").GetInt32();
        var docs = root.GetProperty("docs");

        var books = new List<BookSearchResult>();
        foreach (var doc in docs.EnumerateArray())
        {
            var key = doc.TryGetProperty("key", out var keyProp) ?
                keyProp.GetString() ?? "": "";

            var title = doc.TryGetProperty("title", out var titleProp) ?
                titleProp.GetString() ?? "Unkown Title" : "Unknown Title";

            var authors = new List<string>();
            if(doc.TryGetProperty("author_name", out var authorProp))
            {
                foreach (var a in authorProp.EnumerateArray())
                {
                    authors.Add(a.GetString() ?? "");
                }
            }

            string? coverUrl = null;
            if(doc.TryGetProperty("cover_i", out var coverProp))
                coverUrl = $"https://covers.openlibrary.org/b/id/{coverProp.GetInt32()}-M.jpg";
            
            int? year = null;
            if(doc.TryGetProperty("first_publish_year", out var yearProp))
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
            TotalResult = totalFind,
            Page = page,
            Limit = limit,
            Books = books
        };
    }
    
    public async Task<object?> GetBookDetailsAsync(string olid)
    {
        var response = await _httpClient.GetAsync($"works/{olid}.json");
        if(!response.IsSuccessStatusCode) return null;

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

        return new {description};
    }
}
