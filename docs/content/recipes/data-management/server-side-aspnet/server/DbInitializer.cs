using OrdersApi.Models;

namespace OrdersApi.Data;

public static class DbInitializer
{
    private static readonly string[] Statuses = { "pending", "paid", "shipped", "delivered", "cancelled" };

    private static readonly string[] Customers =
    {
        "Ana García", "James Okafor", "Li Wei", "Marta Nowak", "Diego Fernández",
        "Priya Sharma", "Tom Becker", "Fatima Al-Sayed", "Noah Kim", "Elena Rossi",
    };

    // Seeds 50 orders so pagination, sorting, and filtering are meaningful from
    // the first load. Guarded so re-running the app doesn't duplicate rows.
    public static void Seed(AppDbContext db)
    {
        if (db.Orders.Any())
        {
            return;
        }

        var random = new Random(42);
        var orders = new List<Order>();

        for (var i = 1; i <= 50; i++)
        {
            orders.Add(new Order
            {
                OrderNumber = $"ORD-{1000 + i}",
                Customer = Customers[random.Next(Customers.Length)],
                Status = Statuses[random.Next(Statuses.Length)],
                Total = Math.Round((decimal)(random.NextDouble() * 480 + 20), 2),
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 180)),
            });
        }

        db.Orders.AddRange(orders);
        db.SaveChanges();
    }
}
