# db/seeds.rb
#
# Run with: rails db:seed
#
# Inserts 50 realistic order rows. The check against existing data makes
# the seed idempotent -- running it twice does not duplicate rows.

if Order.exists?
  puts "Database already seeded -- skipping."
else
  customers = [
    "Acme Corp", "Vertex Industries", "Harbor Goods", "Alpine Supply Co.",
    "Summit Partners", "Meridian Analytics", "Riverstone Ltd.", "Orbit Logistics",
    "Beacon Retail", "Northwind Traders"
  ]

  statuses = %w[pending paid shipped delivered cancelled]

  orders = 50.times.map do |i|
    {
      order_number: "ORD-#{(1000 + i).to_s.rjust(5, '0')}",
      customer:     customers.sample,
      status:       statuses.sample,
      total:        (50 + rand * 4950).round(2),
      created_at:   rand(120).days.ago
    }
  end

  Order.insert_all!(orders)

  puts "Seeded #{orders.size} orders."
end
