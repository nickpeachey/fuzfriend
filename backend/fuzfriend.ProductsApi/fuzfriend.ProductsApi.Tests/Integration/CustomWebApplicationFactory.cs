using System.Linq;
using fuzfriend.ProductsApi.Data;
using fuzfriend.ProductsApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace fuzfriend.ProductsApi.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Build provider and seed deterministic data (DbContext registered in Program for Testing)
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EcommerceDbContext>();
            db.Database.EnsureCreated();

            // Seed: 6 Laptops, 4 Phones, 3 Watches
            if (!db.Products.Any())
            {
                for (int i = 1; i <= 6; i++)
                {
                    db.Products.Add(new Product
                    {
                        Title = $"Laptop {i}",
                        Description = "High performance laptop",
                        Brand = i % 2 == 0 ? "BrandL1" : "BrandL2",
                        Category = "Laptops",
                        Color = i % 2 == 0 ? "Silver" : "Black",
                        Size = "15\"",
                        Price = 1000 + i,
                        Rating = 4.5,
                        OnPromotion = false,
                        ImageUrls = new() { "http://example.com/l.jpg" }
                    });
                }
                for (int i = 1; i <= 4; i++)
                {
                    db.Products.Add(new Product
                    {
                        Title = $"Phone {i}",
                        Description = "Smartphone",
                        Brand = "BrandP",
                        Category = "Phones",
                        Color = "Black",
                        Size = "6\"",
                        Price = 500 + i,
                        Rating = 4.0,
                        OnPromotion = false,
                        ImageUrls = new() { "http://example.com/p.jpg" }
                    });
                }
                for (int i = 1; i <= 3; i++)
                {
                    db.Products.Add(new Product
                    {
                        Title = $"Watch {i}",
                        Description = "Watch",
                        Brand = "BrandW",
                        Category = "Watches",
                        Color = "Gold",
                        Size = "One Size",
                        Price = 200 + i,
                        Rating = 4.2,
                        OnPromotion = false,
                        ImageUrls = new() { "http://example.com/w.jpg" }
                    });
                }
                db.SaveChanges();
            }
        });
    }
}
