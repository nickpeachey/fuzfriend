using System.ComponentModel.DataAnnotations;

namespace fuzfriend.ProductsApi.Models;

public class Product
{
    public int Id { get; set; }
    [Required]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public string Brand { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;

    public string Size { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public double Rating { get; set; }

    public bool OnPromotion { get; set; }

    public List<string> ImageUrls { get; set; } = new();
}