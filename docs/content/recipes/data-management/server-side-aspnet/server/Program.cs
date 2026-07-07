using Microsoft.EntityFrameworkCore;
using OrdersApi.Data;
using OrdersApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=orders.db"));
builder.Services.AddScoped<OrdersService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// UseCors must run before MapControllers -- registered after, the preflight
// OPTIONS request reaches the router with no CORS headers attached.
app.UseCors("AllowFrontend");
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbInitializer.Seed(db);
}

app.Run();
