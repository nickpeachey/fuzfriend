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

    [HttpGet]
    public async Task<ActionResult<ProductResponse>> GetProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var cacheKey = $"Products:Get:page={page};pageSize={pageSize}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            var cachedResp = JsonSerializer.Deserialize<ProductResponse>(cached, JsonOpts);
            if (cachedResp != null) return Ok(cachedResp);
        }

        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = page, PageSize = pageSize });

        var jsonResult = JsonSerializer.Serialize(result, JsonOpts);
        await _cache.SetStringAsync(cacheKey, jsonResult, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
        });

        return Ok(result);
    }

    [HttpGet("count")]
    public async Task<ActionResult<int>> GetProductsCount()
    {
        const string cacheKey = "Products:Count";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached) && int.TryParse(cached, out var cachedCount))
        {
            return Ok(cachedCount);
        }

        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = 1, PageSize = 1 });
        await _cache.SetStringAsync(cacheKey, result.TotalCount.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
        });
        return Ok(result.TotalCount);
    }

    [HttpPost("search")]
    public async Task<ActionResult<ProductResponse>> SearchProducts([FromBody] ProductQueryDto? query)
    {
        var cacheKey = BuildSearchKey(query);
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            var cachedResp = JsonSerializer.Deserialize<ProductResponse>(cached, JsonOpts);
            if (cachedResp != null) return Ok(cachedResp);
        }

        var result = await _service.GetProductsAsync(query);

        var jsonResult = JsonSerializer.Serialize(result, JsonOpts);
        await _cache.SetStringAsync(cacheKey, jsonResult, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
        });

        return Ok(result);
    }
}