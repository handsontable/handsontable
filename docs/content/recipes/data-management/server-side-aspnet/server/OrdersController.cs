using Microsoft.AspNetCore.Mvc;
using OrdersApi.Models;
using OrdersApi.Services;

namespace OrdersApi.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrdersService _service;

    public OrdersController(OrdersService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] OrdersQuery query, CancellationToken cancellationToken)
    {
        var (rows, totalRows) = await _service.GetOrdersAsync(query, cancellationToken);

        return Ok(new { rows, totalRows });
    }

    [HttpPost("create_rows")]
    public async Task<IActionResult> CreateRows([FromBody] CreateRowsRequest request, CancellationToken cancellationToken)
    {
        var rows = await _service.CreateRowsAsync(request.Rows, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new { rows });
    }

    [HttpPatch("update_rows")]
    public async Task<IActionResult> UpdateRows([FromBody] UpdateRowsRequest request, CancellationToken cancellationToken)
    {
        var rows = await _service.UpdateRowsAsync(request.Rows, cancellationToken);

        return Ok(new { rows });
    }

    [HttpDelete("remove_rows")]
    public async Task<IActionResult> RemoveRows([FromBody] RemoveRowsRequest request, CancellationToken cancellationToken)
    {
        await _service.RemoveRowsAsync(request.RowIds, cancellationToken);

        return NoContent();
    }
}
