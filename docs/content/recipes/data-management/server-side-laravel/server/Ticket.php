<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Ticket Eloquent model.
 *
 * Maps to the `tickets` table created by the migration.
 * The $fillable array lists every column that can be mass-assigned --
 * required when creating or updating rows via $model->fill($attributes).
 */
class Ticket extends Model
{
    protected $fillable = [
        'subject',
        'status',
        'priority',
        'assignee',
        'created_at',
    ];

    /**
     * Cast created_at to a plain date string so the API returns
     * "2025-01-15" instead of a full timestamp object.
     */
    protected $casts = [
        'created_at' => 'date:Y-m-d',
    ];

    public $timestamps = false;
}
