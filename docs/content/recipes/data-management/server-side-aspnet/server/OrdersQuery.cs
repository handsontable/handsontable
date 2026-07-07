namespace OrdersApi.Models;

public class SortDto
{
    public string? Prop { get; set; }
    public string? Order { get; set; }
}

public class FilterDto
{
    public string Prop { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string? Value { get; set; }
}

// Bound from the query string via [FromQuery]. ASP.NET Core's model binder
// reads nested properties from dot notation (sort.prop, sort.order) and
// indexed collections from filters[N].prop / .condition / .value -- no
// custom binder or [FromQuery] attribute per property is needed.
public class OrdersQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public SortDto? Sort { get; set; }
    public List<FilterDto> Filters { get; set; } = new();
}
