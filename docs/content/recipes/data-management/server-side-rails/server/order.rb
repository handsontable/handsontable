# app/models/order.rb
#
# Order model for the Order Management demo grid.
#
# Fields match the Handsontable column definitions:
#   id           - auto-increment primary key, used as rowId on the frontend
#   order_number - short identifier shown in the first column
#   customer     - customer display name
#   status       - workflow state (pending, paid, shipped, delivered, cancelled)
#   total        - order total; DecimalField avoids floating-point rounding
#   created_at   - read-only timestamp filled on insert
class Order < ApplicationRecord
  STATUSES = %w[pending paid shipped delivered cancelled].freeze

  validates :order_number, presence: true, uniqueness: true
  validates :customer,     presence: true
  validates :status,       inclusion: { in: STATUSES }
  validates :total,        numericality: { greater_than_or_equal_to: 0 }

  # Keeps the initial grid display predictable before the user sorts.
  default_scope -> { order(created_at: :desc) }
end
