using Bogus;
using fuzfriend.ProductsApi.Models;

namespace fuzfriend.ProductsApi.Data;

public static class DbSeeder
    {
        public static void Seed(EcommerceDbContext context)
        {
            if (context.Products.Any())
                return; // already seeded

            var categories = new[]
            {
                "Smartphones", "Laptops", "Headphones", "Footwear", "Accessories",
                "Gaming", "Home Appliances", "Beauty", "Watches", "Cameras"
            };

            var brands = new[]
            {
                "Apple", "Samsung", "Sony", "Nike", "Adidas", "Dell", "HP",
                "LG", "Canon", "Panasonic", "Bose", "JBL", "Microsoft", "Asus", "Lenovo"
            };

            var colors = new[] { "Black", "White", "Blue", "Red", "Green", "Silver", "Grey", "Gold" };
            var sizes = new[] { "Small", "Medium", "Large", "128GB", "256GB", "512GB", "One Size", "UK 9", "EU 42" };

            // Pexels category-based image URLs (these are real & safe)
            var categoryImages = new Dictionary<string, string[]>
            {
                ["Smartphones"] = new[]
                {
                    "https://images.pexels.com/photos/1289904/pexels-photo-1289904.jpeg",
                    "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg"
                },
                ["Laptops"] = new[]
                {
                    "https://images.pexels.com/photos/18105/pexels-photo.jpg",
                    "https://images.pexels.com/photos/18106/pexels-photo.jpg"
                },
                ["Headphones"] = new[]
                {
                    "https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg",
                    "https://images.pexels.com/photos/3394661/pexels-photo-3394661.jpeg"
                },
                ["Footwear"] = new[]
                {
                    "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg",
                    "https://images.pexels.com/photos/19090/pexels-photo.jpg"
                },
                ["Gaming"] = new[]
                {
                    "https://images.pexels.com/photos/907221/pexels-photo-907221.jpeg",
                    "https://images.pexels.com/photos/3945659/pexels-photo-3945659.jpeg"
                },
                ["Home Appliances"] = new[]
                {
                    "https://images.pexels.com/photos/3737691/pexels-photo-3737691.jpeg",
                    "https://images.pexels.com/photos/3737692/pexels-photo-3737692.jpeg"
                },
                ["Beauty"] = new[]
                {
                    "https://images.pexels.com/photos/3373747/pexels-photo-3373747.jpeg",
                    "https://images.pexels.com/photos/3735639/pexels-photo-3735639.jpeg"
                },
                ["Watches"] = new[]
                {
                    "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg",
                    "https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg"
                },
                ["Cameras"] = new[]
                {
                    "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg",
                    "https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg"
                },
                ["Accessories"] = new[]
                {
                    "https://images.pexels.com/photos/845434/pexels-photo-845434.jpeg",
                    "https://images.pexels.com/photos/845451/pexels-photo-845451.jpeg"
                }
            };

            var faker = new Faker<Product>()
                .RuleFor(p => p.Title, f => f.Commerce.ProductName())
                .RuleFor(p => p.Description, f => f.Commerce.ProductDescription())
                .RuleFor(p => p.Brand, f => f.PickRandom(brands))
                .RuleFor(p => p.Category, f => f.PickRandom(categories))
                .RuleFor(p => p.Color, f => f.PickRandom(colors))
                .RuleFor(p => p.Size, f => f.PickRandom(sizes))
                .RuleFor(p => p.Price, f => Math.Round(f.Random.Decimal(10, 2000), 2))
                .RuleFor(p => p.Rating, f => Math.Round(f.Random.Double(3.0, 5.0), 1))
                .RuleFor(p => p.OnPromotion, f => f.Random.Bool(0.2f))
                .RuleFor(p => p.ImageUrls, (f, p) =>
                {
                    var imgs = categoryImages.ContainsKey(p.Category)
                        ? categoryImages[p.Category]
                        : new[] { "https://picsum.photos/800/800?random=" + f.Random.Int(1, 9999) };

                    return imgs.ToList();
                });

            var products = faker.Generate(1000);

            context.Products.AddRange(products);
            context.SaveChanges();
        }
    }