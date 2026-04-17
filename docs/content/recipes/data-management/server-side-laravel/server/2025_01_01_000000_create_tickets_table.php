<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the tickets table.
 *
 * Run with: php artisan migrate
 * Roll back with: php artisan migrate:rollback
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            // ENUM columns keep values predictable and let the DB enforce them.
            $table->enum('status', ['open', 'in-progress', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->string('assignee');
            $table->date('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
