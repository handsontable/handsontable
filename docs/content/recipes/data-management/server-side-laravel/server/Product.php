<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Mass-assignable columns. 'id' is intentionally excluded (auto-increment).
    protected $fillable = ['name', 'sku', 'category', 'price', 'stock'];

    // Cast numeric columns so Laravel returns real numbers, not strings.
    protected $casts = [
        'price' => 'float',
        'stock' => 'integer',
    ];
}
