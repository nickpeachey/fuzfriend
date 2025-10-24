using fuzfriend.ProductsApi.Data;
using fuzfriend.ProductsApi.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(c => c.Value)
    .Where(v => !string.IsNullOrWhiteSpace(v))
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Fallback for when no origins are configured (e.g., local dev). Consider tightening for production.
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// Distributed cache: InMemory for Testing, Redis otherwise
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDistributedMemoryCache();
}
else
{
    var redisConfig = builder.Configuration.GetSection("Redis:Configuration").Value ?? "localhost:6379";
    var redisInstance = builder.Configuration.GetSection("Redis:InstanceName").Value ?? "ProductsApi:";
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConfig;
        options.InstanceName = redisInstance;
    });
}

// Database connection: Use InMemory for Testing, PostgreSQL otherwise
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<EcommerceDbContext>(options =>
        options.UseInMemoryDatabase("TestingDb"));
}
else
{
    builder.Services.AddDbContext<EcommerceDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Register services
builder.Services.AddScoped<ProductService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();

// Enable CORS before endpoints
app.UseCors("FrontendCors");

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EcommerceDbContext>();
    // Only attempt migrations for relational providers (avoids failures with InMemory during tests)
    if (db.Database.IsRelational())
    {
        db.Database.Migrate();
    }
    // Skip seeding in Testing environment to allow integration tests to control data
    if (!app.Environment.IsEnvironment("Testing"))
    {
        DbSeeder.Seed(db);
    }
}

app.Run();

// Expose Program class for WebApplicationFactory in tests
public partial class Program { }
