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

        var ids = query.Ids?.Distinct().ToList();
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
        var noFilters = (ids == null || ids.Count == 0)
                && (categories == null || categories.Count == 0)
                            && (brands == null || brands.Count == 0)
                            && (colours == null || colours.Count == 0)
                            && (sizes == null || sizes.Count == 0)
                            && !minPrice.HasValue
                            && !maxPrice.HasValue
                            && !minRating.HasValue
                            && !onPromotion.HasValue;

        // Apply filters (only when provided)
        if (ids?.Any() == true)
            productsQuery = productsQuery.Where(p => ids.Contains(p.Id));
        if (categories?.Any() == true)
            productsQuery = productsQuery.Where(p => categories.Contains(p.Category));
        if (brands?.Any() == true)
            productsQuery = productsQuery.Where(p => brands.Contains(p.Brand));
        if (colours?.Any() == true)
            productsQuery = productsQuery.Where(p => colours.Contains(p.Color));
        if (sizes?.Any() == true)
            productsQuery = productsQuery.Where(p => sizes.Contains(p.Size));
        // Free-text search
        if (!string.IsNullOrWhiteSpace(query.Query))
        {
            var q = query.Query.Trim().ToLower();
            productsQuery = productsQuery.Where(p =>
                p.Title.ToLower().Contains(q) ||
                p.Description.ToLower().Contains(q) ||
                p.Brand.ToLower().Contains(q) ||
                p.Category.ToLower().Contains(q)
            );
        }
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

        // Faceted counts with self-facet exclusion: compute each facet's counts by applying all filters
        // except the facet itself, so users can multi-select within a facet.
        IQueryable<Models.Product> ApplyCommonFilters(IQueryable<Models.Product> q, bool includeCategories, bool includeBrands, bool includeColours, bool includeSizes)
        {
            if (ids?.Any() == true) q = q.Where(p => ids.Contains(p.Id));
            if (!string.IsNullOrWhiteSpace(query.Query))
            {
                var qtext = query.Query.Trim().ToLower();
                q = q.Where(p => p.Title.ToLower().Contains(qtext) || p.Description.ToLower().Contains(qtext) || p.Brand.ToLower().Contains(qtext) || p.Category.ToLower().Contains(qtext));
            }
            if (minPrice.HasValue) q = q.Where(p => p.Price >= minPrice.Value);
            if (maxPrice.HasValue) q = q.Where(p => p.Price <= maxPrice.Value);
            if (minRating.HasValue) q = q.Where(p => p.Rating >= minRating.Value);
            if (onPromotion.HasValue) q = q.Where(p => p.OnPromotion == onPromotion.Value);
            if (includeCategories && categories?.Any() == true) q = q.Where(p => categories.Contains(p.Category));
            if (includeBrands && brands?.Any() == true) q = q.Where(p => brands.Contains(p.Brand));
            if (includeColours && colours?.Any() == true) q = q.Where(p => colours.Contains(p.Color));
            if (includeSizes && sizes?.Any() == true) q = q.Where(p => sizes.Contains(p.Size));
            return q;
        }

        var forCategories = ApplyCommonFilters(_context.Products.AsNoTracking(), includeCategories: false, includeBrands: true, includeColours: true, includeSizes: true);
        var forBrands = ApplyCommonFilters(_context.Products.AsNoTracking(), includeCategories: true, includeBrands: false, includeColours: true, includeSizes: true);
        var forColours = ApplyCommonFilters(_context.Products.AsNoTracking(), includeCategories: true, includeBrands: true, includeColours: false, includeSizes: true);
        var forSizes = ApplyCommonFilters(_context.Products.AsNoTracking(), includeCategories: true, includeBrands: true, includeColours: true, includeSizes: false);

        var categoryCounts = await forCategories.GroupBy(p => p.Category).Select(g => new { Key = g.Key, Count = g.Count() }).ToListAsync();
        var brandCounts = await forBrands.GroupBy(p => p.Brand).Select(g => new { Key = g.Key, Count = g.Count() }).ToListAsync();
        var colourCounts = await forColours.GroupBy(p => p.Color).Select(g => new { Key = g.Key, Count = g.Count() }).ToListAsync();
        var sizeCounts = await forSizes.GroupBy(p => p.Size).Select(g => new { Key = g.Key, Count = g.Count() }).ToListAsync();

        decimal priceMin = 0;
        decimal priceMax = 0;
        if (await baseQuery.AnyAsync())
        {
            priceMin = await baseQuery.MinAsync(p => p.Price);
            priceMax = await baseQuery.MaxAsync(p => p.Price);
        }
        var ratings = await baseQuery.Select(p => (int)Math.Floor(p.Rating)).Distinct().OrderBy(r => r).ToListAsync();
        var hasPromos = await baseQuery.AnyAsync(p => p.OnPromotion);

        var availableFilters = new FilterOptions
        {
            Categories = categoryCounts.Where(x => x.Key != null && x.Count > 0).Select(x => x.Key!).Distinct().ToList(),
            Brands = brandCounts.Where(x => x.Key != null && x.Count > 0).Select(x => x.Key!).Distinct().ToList(),
            Colours = colourCounts.Where(x => x.Key != null && x.Count > 0).Select(x => x.Key!).Distinct().ToList(),
            Sizes = sizeCounts.Where(x => x.Key != null && x.Count > 0).Select(x => x.Key!).Distinct().ToList(),
            CategoryCounts = categoryCounts.Where(x => x.Key != null).ToDictionary(x => x.Key!, x => x.Count),
            BrandCounts = brandCounts.Where(x => x.Key != null).ToDictionary(x => x.Key!, x => x.Count),
            ColourCounts = colourCounts.Where(x => x.Key != null).ToDictionary(x => x.Key!, x => x.Count),
            SizeCounts = sizeCounts.Where(x => x.Key != null).ToDictionary(x => x.Key!, x => x.Count),
            MinPrice = priceMin,
            MaxPrice = priceMax,
            Ratings = ratings,
            HasPromotions = hasPromos
        };

        return new ProductResponse
        {
            Products = products,
            TotalCount = totalCount,
            Filters = availableFilters
        };
    }

    public async Task<Models.Product?> GetProductByIdAsync(int id)
    {
        // Enforce exact key lookup and no tracking
        return await _context.Products
            .AsNoTracking()
            .SingleOrDefaultAsync(p => p.Id == id);
    }
}