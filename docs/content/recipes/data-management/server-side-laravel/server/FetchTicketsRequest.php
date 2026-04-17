<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates and casts the query parameters sent by Handsontable's dataProvider.
 *
 * FormRequest runs before the controller method. If validation fails, Laravel
 * automatically returns a 422 JSON response -- no try/catch needed.
 *
 * Handsontable sends:
 *   page=1&pageSize=10
 *   &sort={"column":"status","order":"asc"}        (when a sort is active)
 *   &filters=[{"prop":"status","condition":"eq","value":["open"]}]  (when filters are active)
 *
 * The sort and filters values are JSON strings encoded by the frontend buildUrl()
 * helper. The controller decodes them before passing to the service.
 */
class FetchTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page'     => ['required', 'integer', 'min:1'],
            'pageSize' => ['required', 'integer', 'min:1', 'max:100'],
            // sort and filters arrive as JSON strings -- validate as strings here,
            // decode and validate structure in the controller/service.
            'sort'    => ['nullable', 'string'],
            'filters' => ['nullable', 'string'],
        ];
    }

    /**
     * Cast page and pageSize to integers automatically.
     * Query-string values are always strings; this saves manual intval() calls.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'page'     => (int) $this->input('page', 1),
            'pageSize' => (int) $this->input('pageSize', 10),
        ]);
    }
}
