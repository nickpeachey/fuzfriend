using fuzfriend.ProductsApi.Data;
using fuzfriend.ProductsApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace fuzfriend.ProductsApi.Services;

public class ProductService
{
    private readonly EcommerceDbContext _context;

    public ProductService(EcommerceDbContext context)
    {
        _context = context;
    }

    public async Task<ProductResponse> GetProductsAsync(ProductQueryDto? query)
    {
        // Ensure a non-null query and sane pagination defaults
        query ??= new ProductQueryDto();
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 100);

        var productsQuery = _context.Products.AsQueryable();

        // Normalize incoming filters: treat empty/zero as not provided
        var category = string.IsNullOrWhiteSpace(query.Category) ? null : query.Category;
        var categories = query.Categories?.Where(c => !string.IsNullOrWhiteSpace(c)).ToList() ?? new List<string>();
        if (category != null)
        {
            categories.Add(category);
        }
        categories = categories.Distinct().ToList();

        var brands = query.Brands?.Where(b => !string.IsNullOrWhiteSpace(b)).Distinct().ToList();
        var colours = query.Colours?.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList();
        var sizes = query.Sizes?.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();

        decimal? minPrice = query.MinPrice.HasValue && query.MinPrice.Value > 0 ? query.MinPrice.Value : null;
        decimal? maxPrice = query.MaxPrice.HasValue && query.MaxPrice.Value > 0 ? query.MaxPrice.Value : null;
        if (minPrice.HasValue && maxPrice.HasValue && maxPrice < minPrice)
        {
            // swap to avoid excluding all results due to inverted bounds
            (minPrice, maxPrice) = (maxPrice, minPrice);
        }

        double? minRating = query.MinRating.HasValue && query.MinRating.Value > 0 ? query.MinRating.Value : null;
        bool? onPromotion = query.OnPromotion; // keep explicit bool, no special normalization

        // Determine if any filters were provided using normalized values
        var noFilters = (categories == null || categories.Count == 0)
                        && (brands == null || brands.Count == 0)
                        && (colours == null || colours.Count == 0)
                        && (sizes == null || sizes.Count == 0)
                        && !minPrice.HasValue
                        && !maxPrice.HasValue
                        && !minRating.HasValue
                        && !onPromotion.HasValue;

        // Apply filters (only when provided)
        if (categories?.Any() == true)
            productsQuery = productsQuery.Where(p => categories.Contains(p.Category));
        if (brands?.Any() == true)
            productsQuery = productsQuery.Where(p => brands.Contains(p.Brand));
        if (colours?.Any() == true)
            productsQuery = productsQuery.Where(p => colours.Contains(p.Color));
        if (sizes?.Any() == true)
            productsQuery = productsQuery.Where(p => sizes.Contains(p.Size));
        if (minPrice.HasValue)
            productsQuery = productsQuery.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            productsQuery = productsQuery.Where(p => p.Price <= maxPrice.Value);
        if (minRating.HasValue)
            productsQuery = productsQuery.Where(p => p.Rating >= minRating.Value);
        if (onPromotion.HasValue)
            productsQuery = productsQuery.Where(p => p.OnPromotion == onPromotion.Value);

        // If no filters were provided, treat as a default "return all products" request
        var baseQuery = (noFilters ? _context.Products : productsQuery).AsNoTracking();

        // Sorting
        var sortBy = (query.SortBy ?? "title").Trim().ToLowerInvariant();
        var sortDir = (query.SortDirection ?? "asc").Trim().ToLowerInvariant();
        bool desc = sortDir == "desc" || sortDir == "descending";

        IOrderedQueryable<Models.Product> ordered = sortBy switch
        {
            "price" => desc ? baseQuery.OrderByDescending(p => p.Price) : baseQuery.OrderBy(p => p.Price),
            "rating" => desc ? baseQuery.OrderByDescending(p => p.Rating) : baseQuery.OrderBy(p => p.Rating),
            "brand" => desc ? baseQuery.OrderByDescending(p => p.Brand) : baseQuery.OrderBy(p => p.Brand),
            "category" => desc ? baseQuery.OrderByDescending(p => p.Category) : baseQuery.OrderBy(p => p.Category),
            _ => desc ? baseQuery.OrderByDescending(p => p.Title) : baseQuery.OrderBy(p => p.Title)
        };

        // Total count + paginated products
        var totalCount = await baseQuery.CountAsync();
        var products = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Available filters based on the current result set
        var filterSource = await baseQuery
            .Select(p => new
            {
                p.Category,
                p.Brand,
                p.Color,
                p.Size,
                p.Price,
                p.Rating,
                p.OnPromotion
            })
            .ToListAsync();

        var availableFilters = new FilterOptions
        {
            Categories = filterSource.Select(p => p.Category).Distinct().ToList(),
            Brands = filterSource.Select(p => p.Brand).Distinct().ToList(),
            Colours = filterSource.Select(p => p.Color).Distinct().ToList(),
            Sizes = filterSource.Select(p => p.Size).Distinct().ToList(),
            MinPrice = filterSource.Any() ? filterSource.Min(p => p.Price) : 0,
            MaxPrice = filterSource.Any() ? filterSource.Max(p => p.Price) : 0,
            Ratings = filterSource.Select(p => (int)Math.Floor(p.Rating)).Distinct().OrderBy(r => r).ToList(),
            HasPromotions = filterSource.Any(p => p.OnPromotion)
        };

        return new ProductResponse
        {
            Products = products,
            Filters = availableFilters,
            TotalCount = totalCount
        };
    }
}