using fuzfriend.ProductsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace fuzfriend.ProductsApi.Data;


public class EcommerceDbContext : DbContext
{
    public EcommerceDbContext(DbContextOptions<EcommerceDbContext> options)
        : base(options) { }

    public DbSet<Product> Products => Set<Product>();
}