using Microsoft.EntityFrameworkCore;
using OrdersApi.Data;
using OrdersApi.Models;

namespace OrdersApi.Services;

public class OrdersService
{
    // Maps the wire-format column names Handsontable sends (camelCase) to the
    // C# property names EF.Property<T> needs. Any prop not in this dictionary
    // is rejected instead of reaching a query -- this is the whitelist.
    private static readonly Dictionary<string, string> ColumnMap = new()
    {
        ["orderNumber"] = nameof(Order.OrderNumber),
        ["customer"] = nameof(Order.Customer),
        ["status"] = nameof(Order.Status),
        ["total"] = nameof(Order.Total),
        ["createdAt"] = nameof(Order.CreatedAt),
    };

    private static readonly HashSet<string> StringColumns = new() { "orderNumber", "customer", "status" };

    // System-managed fields (id, createdAt) are deliberately excluded so
    // update_rows can never overwrite them.
    private static readonly HashSet<string> EditableColumns = new() { "orderNumber", "customer", "status", "total" };

    private readonly AppDbContext _db;

    public OrdersService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(List<Order> Rows, int TotalRows)> GetOrdersAsync(OrdersQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Max(query.PageSize, 1);

        var filtered = ApplyFilters(_db.Orders.AsNoTracking(), query.Filters);
        var totalRows = await filtered.CountAsync(cancellationToken);

        var rows = await ApplySort(filtered, query.Sort)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (rows, totalRows);
    }

    public async Task<List<Order>> CreateRowsAsync(List<OrderCreateDto> rows, CancellationToken cancellationToken)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        var created = rows.Select(row => new Order
        {
            OrderNumber = row.OrderNumber,
            Customer = row.Customer,
            Status = row.Status,
            Total = row.Total,
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        _db.Orders.AddRange(created);
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // Returned with their database-assigned Id so dataProvider can replace
        // the client's placeholder rows.
        return created;
    }

    public async Task<List<Order>> UpdateRowsAsync(List<UpdateRowDto> rows, CancellationToken cancellationToken)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var updated = new List<Order>();

        foreach (var row in rows)
        {
            var order = await _db.Orders.FindAsync(new object[] { row.Id }, cancellationToken);
            if (order is null)
            {
                continue;
            }

            ApplyChanges(order, row.Changes);
            updated.Add(order);
        }

        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return updated;
    }

    public async Task RemoveRowsAsync(List<int> rowIds, CancellationToken cancellationToken)
    {
        // A single DELETE ... WHERE Id IN (...) instead of one round trip per row.
        await _db.Orders
            .Where(o => rowIds.Contains(o.Id))
            .ExecuteDeleteAsync(cancellationToken);
    }

    private static void ApplyChanges(Order order, Dictionary<string, System.Text.Json.JsonElement> changes)
    {
        foreach (var (key, element) in changes)
        {
            if (!EditableColumns.Contains(key))
            {
                continue;
            }

            switch (key)
            {
                case "orderNumber":
                    order.OrderNumber = element.GetString() ?? order.OrderNumber;
                    break;
                case "customer":
                    order.Customer = element.GetString() ?? order.Customer;
                    break;
                case "status":
                    order.Status = element.GetString() ?? order.Status;
                    break;
                case "total":
                    order.Total = element.GetDecimal();
                    break;
            }
        }
    }

    private static IQueryable<Order> ApplySort(IQueryable<Order> query, SortDto? sort)
    {
        if (sort?.Prop == null || !ColumnMap.TryGetValue(sort.Prop, out var property))
        {
            return query.OrderByDescending(o => o.CreatedAt);
        }

        var descending = string.Equals(sort.Order, "desc", StringComparison.OrdinalIgnoreCase);

        return descending
            ? query.OrderByDescending(o => EF.Property<object>(o, property))
            : query.OrderBy(o => EF.Property<object>(o, property));
    }

    private static IQueryable<Order> ApplyFilters(IQueryable<Order> query, List<FilterDto> filters)
    {
        foreach (var filter in filters)
        {
            if (!ColumnMap.TryGetValue(filter.Prop, out var property))
            {
                continue; // unknown column name -- ignored instead of trusted
            }

            query = StringColumns.Contains(filter.Prop)
                ? ApplyStringFilter(query, property, filter)
                : ApplyNumericFilter(query, property, filter);
        }

        return query;
    }

    private static IQueryable<Order> ApplyStringFilter(IQueryable<Order> query, string property, FilterDto filter)
    {
        var value = filter.Value ?? string.Empty;
        var likeValue = EscapeLike(value);

        return filter.Condition switch
        {
            "eq" => query.Where(o => EF.Property<string>(o, property) == value),
            "neq" => query.Where(o => EF.Property<string>(o, property) != value),
            "contains" => query.Where(o => EF.Functions.Like(EF.Property<string>(o, property), $"%{likeValue}%", "\\")),
            "not_contains" => query.Where(o => !EF.Functions.Like(EF.Property<string>(o, property), $"%{likeValue}%", "\\")),
            "begins_with" => query.Where(o => EF.Functions.Like(EF.Property<string>(o, property), $"{likeValue}%", "\\")),
            "ends_with" => query.Where(o => EF.Functions.Like(EF.Property<string>(o, property), $"%{likeValue}", "\\")),
            "empty" => query.Where(o => EF.Property<string>(o, property) == null || EF.Property<string>(o, property) == string.Empty),
            "not_empty" => query.Where(o => EF.Property<string>(o, property) != null && EF.Property<string>(o, property) != string.Empty),
            _ => query,
        };
    }

    private static IQueryable<Order> ApplyNumericFilter(IQueryable<Order> query, string property, FilterDto filter)
    {
        if (filter.Condition is "empty" or "not_empty")
        {
            // Total is non-nullable -- there's no empty numeric state to check.
            return query;
        }

        if (!decimal.TryParse(filter.Value, out var value))
        {
            return query; // malformed numeric input -- ignored rather than thrown
        }

        return filter.Condition switch
        {
            "eq" => query.Where(o => EF.Property<decimal>(o, property) == value),
            "neq" => query.Where(o => EF.Property<decimal>(o, property) != value),
            "gt" => query.Where(o => EF.Property<decimal>(o, property) > value),
            "gte" => query.Where(o => EF.Property<decimal>(o, property) >= value),
            "lt" => query.Where(o => EF.Property<decimal>(o, property) < value),
            "lte" => query.Where(o => EF.Property<decimal>(o, property) <= value),
            _ => query,
        };
    }

    // Escapes LIKE metacharacters in user input so they're treated as literals,
    // not wildcards. Paired with the ESCAPE '\' clause passed to EF.Functions.Like.
    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}
