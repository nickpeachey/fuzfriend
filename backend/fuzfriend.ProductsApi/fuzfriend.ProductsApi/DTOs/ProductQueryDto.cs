using fuzfriend.ProductsApi.Models;

namespace fuzfriend.ProductsApi.DTOs;

public class ProductQueryDto
{
    // Optional: filter by specific product IDs
    public List<int>? Ids { get; set; }
    // Single category for backward compatibility
    public string? Category { get; set; }
    // New: support multiple categories
    public List<string>? Categories { get; set; }
    public List<string>? Brands { get; set; }
    public List<string>? Colours { get; set; }
    public List<string>? Sizes { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? MinRating { get; set; }
    public bool? OnPromotion { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    // New: sorting options (supported: title, price, rating, brand, category)
    public string? SortBy { get; set; }
    // asc or desc
    public string? SortDirection { get; set; }

    // New: free-text search across title, description, brand, category
    public string? Query { get; set; }
}

public class FilterOptions
{
    public List<string> Categories { get; set; } = new();
    public List<string> Brands { get; set; } = new();
    public List<string> Colours { get; set; } = new();
    public List<string> Sizes { get; set; } = new();
    // New: facet counts for filters
    public Dictionary<string, int> CategoryCounts { get; set; } = new();
    public Dictionary<string, int> BrandCounts { get; set; } = new();
    public Dictionary<string, int> ColourCounts { get; set; } = new();
    public Dictionary<string, int> SizeCounts { get; set; } = new();
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public List<int> Ratings { get; set; } = new();
    public bool HasPromotions { get; set; }
}

public class ProductResponse
{
    public IEnumerable<Product> Products { get; set; } = Enumerable.Empty<Product>();
    public FilterOptions Filters { get; set; } = new();
    public int TotalCount { get; set; }
}