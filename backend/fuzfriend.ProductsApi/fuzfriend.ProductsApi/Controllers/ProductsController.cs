using fuzfriend.ProductsApi.DTOs;
using fuzfriend.ProductsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace fuzfriend.ProductsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _service;

    public ProductsController(ProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ProductResponse>> GetProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = page, PageSize = pageSize });
        return Ok(result);
    }

    [HttpGet("count")]
    public async Task<ActionResult<int>> GetProductsCount()
    {
        var result = await _service.GetProductsAsync(new ProductQueryDto { Page = 1, PageSize = 1 });
        return Ok(result.TotalCount);
    }

    [HttpPost("search")]
    public async Task<ActionResult<ProductResponse>> SearchProducts([FromBody] ProductQueryDto? query)
    {
        var result = await _service.GetProductsAsync(query);
        return Ok(result);
    }
}