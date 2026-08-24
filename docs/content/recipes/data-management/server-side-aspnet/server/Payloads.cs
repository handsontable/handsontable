using System.Text.Json;

namespace OrdersApi.Models;

// No Id or CreatedAt property -- the type system blocks clients from setting
// system-managed fields, instead of filtering them out of a dictionary at
// runtime.
public class OrderCreateDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public decimal Total { get; set; }
}

public class CreateRowsRequest
{
    public List<OrderCreateDto> Rows { get; set; } = new();
}

public class UpdateRowDto
{
    public int Id { get; set; }
    public Dictionary<string, JsonElement> Changes { get; set; } = new();
}

public class UpdateRowsRequest
{
    public List<UpdateRowDto> Rows { get; set; } = new();
}

public class RemoveRowsRequest
{
    public List<int> RowIds { get; set; } = new();
}
