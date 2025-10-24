using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace fuzfriend.ProductsApi.Tests.Integration;

public class ProductsSearchIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProductsSearchIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Post_Search_With_SingleCategory_ReturnsOnlyThatCategory()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            categories = new[] { "Laptops" },
            page = 1,
            pageSize = 100
        };

        var resp = await client.PostAsJsonAsync("/api/Products/search", payload);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        var total = root.GetProperty("totalCount").GetInt32();
        Assert.Equal(6, total); // CustomWebApplicationFactory seeds 6 laptops

        var products = root.GetProperty("products");
        Assert.Equal(6, products.GetArrayLength());
        foreach (var p in products.EnumerateArray())
        {
            Assert.Equal("Laptops", p.GetProperty("category").GetString());
        }
    }

    [Fact]
    public async Task Post_Search_With_MultipleCategories_ReturnsUnion()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            categories = new[] { "Laptops", "Watches" },
            page = 1,
            pageSize = 100
        };

        var resp = await client.PostAsJsonAsync("/api/Products/search", payload);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        var total = root.GetProperty("totalCount").GetInt32();
        Assert.Equal(9, total); // 6 Laptops + 3 Watches

        var products = root.GetProperty("products");
        Assert.Equal(9, products.GetArrayLength());
        foreach (var p in products.EnumerateArray())
        {
            var cat = p.GetProperty("category").GetString();
            Assert.True(cat == "Laptops" || cat == "Watches");
        }
    }

    [Fact]
    public async Task Post_Search_With_Brands_And_Colours_Filters_List()
    {
        var client = _factory.CreateClient();

        // From seed: Laptops have BrandL1/BrandL2 and colours Silver/Black.
        var payload = new
        {
            categories = new[] { "Laptops" },
            brands = new[] { "BrandL1" },
            colours = new[] { "Silver" },
            page = 1,
            pageSize = 100
        };

        var resp = await client.PostAsJsonAsync("/api/Products/search", payload);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        var total = root.GetProperty("totalCount").GetInt32();

        // Expect only Laptops with BrandL1 and Silver color: from seed that is 3 items
        Assert.Equal(3, total);

        var products = root.GetProperty("products");
        Assert.Equal(3, products.GetArrayLength());
        foreach (var p in products.EnumerateArray())
        {
            Assert.Equal("Laptops", p.GetProperty("category").GetString());
            Assert.Equal("BrandL1", p.GetProperty("brand").GetString());
            Assert.Equal("Silver", p.GetProperty("color").GetString());
        }
    }

    [Fact]
    public async Task Post_Search_SortByPrice_Ascending_ReturnsAscending()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            categories = new[] { "Laptops" },
            sortBy = "price",
            sortDirection = "asc",
            page = 1,
            pageSize = 100
        };

        var resp = await client.PostAsJsonAsync("/api/Products/search", payload);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var products = doc.RootElement.GetProperty("products");
        Assert.Equal(6, products.GetArrayLength());

        var firstPrice = products[0].GetProperty("price").GetDecimal();
        var lastPrice = products[products.GetArrayLength() - 1].GetProperty("price").GetDecimal();
        Assert.Equal(1001, firstPrice);
        Assert.Equal(1006, lastPrice);
    }

    [Fact]
    public async Task Post_Search_SortByPrice_Descending_ReturnsDescending()
    {
        var client = _factory.CreateClient();

        var payload = new
        {
            categories = new[] { "Laptops" },
            sortBy = "price",
            sortDirection = "desc",
            page = 1,
            pageSize = 100
        };

        var resp = await client.PostAsJsonAsync("/api/Products/search", payload);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var products = doc.RootElement.GetProperty("products");
        Assert.Equal(6, products.GetArrayLength());

        var firstPrice = products[0].GetProperty("price").GetDecimal();
        var lastPrice = products[products.GetArrayLength() - 1].GetProperty("price").GetDecimal();
        Assert.Equal(1006, firstPrice);
        Assert.Equal(1001, lastPrice);
    }
}
