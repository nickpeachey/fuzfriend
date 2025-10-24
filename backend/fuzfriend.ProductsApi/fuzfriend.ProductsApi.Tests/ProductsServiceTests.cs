using System.Threading.Tasks;
using System.Linq;
using fuzfriend.ProductsApi.Data;
using fuzfriend.ProductsApi.DTOs;
using fuzfriend.ProductsApi.Models;
using fuzfriend.ProductsApi.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace fuzfriend.ProductsApi.Tests;

public class ProductsServiceTests
{
    private static EcommerceDbContext MakeContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<EcommerceDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var ctx = new EcommerceDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private static void Seed(EcommerceDbContext ctx, int count = 50)
    {
        for (int i = 1; i <= count; i++)
        {
            ctx.Products.Add(new Product
            {
                Title = $"Product {i}",
                Description = "Desc",
                Brand = i % 2 == 0 ? "BrandA" : "BrandB",
                Category = i % 3 == 0 ? "Cat1" : "Cat2",
                Color = i % 2 == 0 ? "Black" : "White",
                Size = "One Size",
                Price = 10 + i,
                Rating = (i % 5) + 1,
                OnPromotion = i % 4 == 0,
                ImageUrls = new() { "http://example.com/img.jpg" }
            });
        }
        ctx.SaveChanges();
    }

    [Fact]
    public async Task NoFilters_NullQuery_ReturnsAllProductsPaged()
    {
        using var ctx = MakeContext(nameof(NoFilters_NullQuery_ReturnsAllProductsPaged));
        Seed(ctx, 50);
        var service = new ProductService(ctx);

        var resp = await service.GetProductsAsync(null);

        Assert.NotNull(resp);
        Assert.Equal(50, resp.TotalCount);
        Assert.True(resp.Products.Any());
        Assert.InRange(resp.Products.Count(), 1, 20); // default page size
    }

    [Fact]
    public async Task NoFilters_EmptyListsAndZeros_ReturnsAllProducts()
    {
        using var ctx = MakeContext(nameof(NoFilters_EmptyListsAndZeros_ReturnsAllProducts));
        Seed(ctx, 30);
        var service = new ProductService(ctx);

        var resp = await service.GetProductsAsync(new ProductQueryDto
        {
            Category = " ",
            Brands = new(),
            Colours = new(),
            Sizes = new(),
            MinPrice = 0,
            MaxPrice = 0,
            MinRating = 0,
            OnPromotion = null,
            Page = 1,
            PageSize = 50
        });

        Assert.NotNull(resp);
        Assert.Equal(30, resp.TotalCount);
        Assert.Equal(30, resp.Products.Count());
    }

    [Fact]
    public async Task CategoryFilter_Laptops_ReturnsOnlyLaptops()
    {
        using var ctx = MakeContext(nameof(CategoryFilter_Laptops_ReturnsOnlyLaptops));

        // Seed a mix of categories: 7 Laptops and 5 Phones
        for (int i = 1; i <= 7; i++)
        {
            ctx.Products.Add(new Product
            {
                Title = $"Laptop {i}",
                Description = "High performance laptop",
                Brand = "BrandL",
                Category = "Laptops",
                Color = "Silver",
                Size = "15\"",
                Price = 999 + i,
                Rating = 4.5,
                OnPromotion = false,
                ImageUrls = new() { "http://example.com/l.jpg" }
            });
        }
        for (int i = 1; i <= 5; i++)
        {
            ctx.Products.Add(new Product
            {
                Title = $"Phone {i}",
                Description = "Smartphone",
                Brand = "BrandP",
                Category = "Phones",
                Color = "Black",
                Size = "6\"",
                Price = 499 + i,
                Rating = 4.0,
                OnPromotion = false,
                ImageUrls = new() { "http://example.com/p.jpg" }
            });
        }
        ctx.SaveChanges();

        var service = new ProductService(ctx);

        var resp = await service.GetProductsAsync(new ProductQueryDto
        {
            Category = "Laptops",
            Page = 1,
            PageSize = 50
        });

        Assert.NotNull(resp);
        Assert.Equal(7, resp.TotalCount);
        Assert.Equal(7, resp.Products.Count());
        Assert.All(resp.Products, p => Assert.Equal("Laptops", p.Category));
    }
}
