using fuzfriend.ProductsApi.DTOs;
using fuzfriend.ProductsApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace fuzfriend.ProductsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _service;
    private readonly IDistributedCache _cache;

    public ProductsController(ProductService service, IDistributedCache cache)
    {
        _service = service;
        _cache = cache;
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    private static string Sha256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    private static string BuildSearchKey(ProductQueryDto? query)
    {
        var json = JsonSerializer.Serialize(query ?? new ProductQueryDto(), JsonOpts);
        return $"Products:Search:{Sha256(json)}";
    }

    private bool ShouldBypassCache()
    {
        // Allow clients to bypass distributed caching explicitly for correctness-sensitive paths
        var hasBypassHeader = Request.Headers.TryGetValue("X-Bypass-Cache", out var bypass) &&
                               string.Equals(bypass.ToString(), "1", StringComparison.OrdinalIgnoreCase);
        var hasNoCache = Request.Headers.TryGetValue("Cache-Control", out var cc) &&
                         cc.ToString().Contains("no-cache", StringComparison.OrdinalIgnoreCase);
        var hasPragma = Request.Headers.TryGetValue("Pragma", out var pragma) &&
                        pragma.ToString().Contains("no-cache", StringComparison.OrdinalIgnoreCase);
        return hasBypassHeader || hasNoCache || hasPragma;
    }

    [HttpGet]
    public async Task<ActionResult<ProductResponse>> GetProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        bool bypassCache = ShouldBypassCache();
        var cacheKey = $"Products:Get:page={page};pageSize={pageSize}";
        if (!bypassCache)
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                var cachedResp = JsonSerializer.Deserialize<ProductResponse>(cached, JsonOpts);
                if (cachedResp != null)
                {
                    Response.Headers["X-Cache-Status"] = "HIT";
                    Response.Headers["X-Cache-Key"] = cacheKey;
                    return Ok(cachedResp);
                }
            }
        }

        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = page, PageSize = pageSize });

        if (!bypassCache)
        {
            var jsonResult = JsonSerializer.Serialize(result, JsonOpts);
            await _cache.SetStringAsync(cacheKey, jsonResult, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            Response.Headers["X-Cache-Status"] = "MISS";
            Response.Headers["X-Cache-Key"] = cacheKey;
        }
        else
        {
            Response.Headers["X-Cache-Status"] = "BYPASS";
        }

        return Ok(result);
    }

    [HttpGet("count")]
    public async Task<ActionResult<int>> GetProductsCount()
    {
        bool bypassCache = ShouldBypassCache();
        const string cacheKey = "Products:Count";
        if (!bypassCache)
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached) && int.TryParse(cached, out var cachedCount))
            {
                Response.Headers["X-Cache-Status"] = "HIT";
                Response.Headers["X-Cache-Key"] = cacheKey;
                return Ok(cachedCount);
            }
        }

        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = 1, PageSize = 1 });
        if (!bypassCache)
        {
            await _cache.SetStringAsync(cacheKey, result.TotalCount.ToString(), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            Response.Headers["X-Cache-Status"] = "MISS";
            Response.Headers["X-Cache-Key"] = cacheKey;
        }
        else
        {
            Response.Headers["X-Cache-Status"] = "BYPASS";
        }
        return Ok(result.TotalCount);
    }

    [HttpPost("search")]
    public async Task<ActionResult<ProductResponse>> SearchProducts([FromBody] ProductQueryDto? query)
    {
        bool bypassCache = ShouldBypassCache();
        var cacheKey = BuildSearchKey(query);
        if (!bypassCache)
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                var cachedResp = JsonSerializer.Deserialize<ProductResponse>(cached, JsonOpts);
                if (cachedResp != null)
                {
                    Response.Headers["X-Cache-Status"] = "HIT";
                    Response.Headers["X-Cache-Key"] = cacheKey;
                    return Ok(cachedResp);
                }
            }
        }

        var result = await _service.GetProductsAsync(query);

        if (!bypassCache)
        {
            var jsonResult = JsonSerializer.Serialize(result, JsonOpts);
            await _cache.SetStringAsync(cacheKey, jsonResult, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            Response.Headers["X-Cache-Status"] = "MISS";
            Response.Headers["X-Cache-Key"] = cacheKey;
        }
        else
        {
            Response.Headers["X-Cache-Status"] = "BYPASS";
        }

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetProductById([FromRoute] int id)
    {
        bool bypassCache = ShouldBypassCache();
        var cacheKey = $"Products:GetById:{id}";
        if (!bypassCache)
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                var cachedResp = JsonSerializer.Deserialize<Models.Product>(cached, JsonOpts);
                if (cachedResp != null)
                {
                    Response.Headers["X-Cache-Status"] = "HIT";
                    Response.Headers["X-Cache-Key"] = cacheKey;
                    Response.Headers["X-Requested-Id"] = id.ToString();
                    Response.Headers["X-Returned-Id"] = cachedResp.Id.ToString();
                    return Ok(cachedResp);
                }
            }
        }

        var product = await _service.GetProductByIdAsync(id);
        if (product == null) return NotFound();

        // Extra guard: if somehow EF returned a different record (shouldn't happen),
        // perform a strict ids-based search as a secondary resolution path.
        if (product.Id != id)
        {
            var strict = await _service.GetProductsAsync(new ProductQueryDto
            {
                Ids = new List<int> { id },
                Page = 1,
                PageSize = 1
            });
            var fixedProduct = strict.Products.FirstOrDefault();
            if (fixedProduct != null)
            {
                product = fixedProduct;
                Response.Headers["X-Server-Strict-Fix"] = "1";
            }
        }

        if (!bypassCache)
        {
            var jsonResult = JsonSerializer.Serialize(product, JsonOpts);
            await _cache.SetStringAsync(cacheKey, jsonResult, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            Response.Headers["X-Cache-Status"] = "MISS";
            Response.Headers["X-Cache-Key"] = cacheKey;
        }
        else
        {
            Response.Headers["X-Cache-Status"] = "BYPASS";
        }
        Response.Headers["X-Requested-Id"] = id.ToString();
        Response.Headers["X-Returned-Id"] = product.Id.ToString();

        return Ok(product);
    }
}