<?php

namespace Database\Seeders;

use App\Models\Ticket;
use Illuminate\Database\Seeder;

/**
 * Seeds the tickets table with sample data.
 *
 * Run with: php artisan db:seed --class=TicketSeeder
 * Or add TicketSeeder::class to DatabaseSeeder::run() and run: php artisan db:seed
 */
class TicketSeeder extends Seeder
{
    public function run(): void
    {
        // Guard against duplicate seeds during development.
        if (Ticket::count() > 0) {
            return;
        }

        Ticket::insert([
            ['subject' => 'Login page throws 500 on Safari',            'status' => 'open',        'priority' => 'high',     'assignee' => 'Ana García',    'created_at' => '2025-01-15'],
            ['subject' => 'Export to CSV truncates long text fields',   'status' => 'in-progress', 'priority' => 'medium',   'assignee' => 'James Okafor',  'created_at' => '2025-01-18'],
            ['subject' => 'Dark mode colors incorrect in Firefox',      'status' => 'open',        'priority' => 'low',      'assignee' => 'Li Wei',        'created_at' => '2025-01-22'],
            ['subject' => 'Grid row virtualization skips rows at end',  'status' => 'resolved',    'priority' => 'high',     'assignee' => 'Ana García',    'created_at' => '2025-02-03'],
            ['subject' => 'Filter dropdown overlaps pagination',        'status' => 'closed',      'priority' => 'low',      'assignee' => 'James Okafor',  'created_at' => '2025-02-10'],
            ['subject' => 'Column resize too narrow on touch screens',  'status' => 'open',        'priority' => 'medium',   'assignee' => 'Li Wei',        'created_at' => '2025-02-14'],
            ['subject' => 'Cell editor closes on any outside click',    'status' => 'in-progress', 'priority' => 'critical', 'assignee' => 'Ana García',    'created_at' => '2025-02-20'],
            ['subject' => 'Frozen columns desync on horizontal scroll', 'status' => 'open',        'priority' => 'high',     'assignee' => 'James Okafor',  'created_at' => '2025-03-01'],
            ['subject' => 'Nested headers miss column move reorder',    'status' => 'resolved',    'priority' => 'medium',   'assignee' => 'Li Wei',        'created_at' => '2025-03-05'],
            ['subject' => 'Sort indicator missing after page reload',   'status' => 'open',        'priority' => 'low',      'assignee' => 'Ana García',    'created_at' => '2025-03-12'],
            ['subject' => 'Numeric cell accepts non-numeric paste',     'status' => 'in-progress', 'priority' => 'medium',   'assignee' => 'James Okafor',  'created_at' => '2025-03-18'],
            ['subject' => 'Context menu position off by 1px HiDPI',    'status' => 'closed',      'priority' => 'low',      'assignee' => 'Li Wei',        'created_at' => '2025-03-25'],
        ]);
    }
}
