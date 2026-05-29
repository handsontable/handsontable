# app/controllers/api/orders_controller.rb
#
# API controller providing paginated, sortable, and filterable order data,
# plus three batch CRUD actions that match Handsontable's dataProvider
# payload shape.
#
# The standard RESTful routes would operate on single resources at a time.
# Handsontable sends all row mutations as arrays, so we expose dedicated
# collection endpoints: create_rows / update_rows / remove_rows.
module Api
  class OrdersController < ApplicationController
    # Whitelist of columns that are allowed to appear in `order()` and
    # raw SQL fragments. Values that reach these positions are not quoted
    # as bind parameters, so anything that is not validated is an
    # SQL-injection risk. Keep this list tight.
    SORTABLE_COLUMNS = %w[order_number customer status total created_at].freeze

    # ------------------------------------------------------------------
    # GET /api/orders
    #
    # Accepts:
    #   page, page_size        -- pagination
    #   sort_prop, sort_order  -- single-column sort
    #   filters[N][prop|value|condition] -- column filters
    #
    # Returns:
    #   { rows: [...], total_rows: 123 }
    #
    # The JSON shape is converted to { rows, totalRows } on the frontend
    # (or you can override serialization globally to emit camelCase --
    # see the recipe for the trade-offs).
    # ------------------------------------------------------------------
    def index
      scope = Order.all
      scope = apply_filters(scope)
      scope = apply_sort(scope)
      scope = scope.page(params[:page]).per(params[:page_size] || 10)

      render json: {
        rows:       scope.as_json,
        total_rows: scope.total_count
      }
    end

    # ------------------------------------------------------------------
    # POST /api/orders/create_rows
    #
    # Accepts the onRowsCreate payload: { rows: [ { ... }, ... ] }.
    # Returns the created rows with their database-assigned ids so
    # dataProvider can replace client-side placeholders in its row map.
    # ------------------------------------------------------------------
    def create_rows
      payload = Array(params[:rows])
      allowed = Order.column_names - %w[id created_at updated_at]

      rows = Order.transaction do
        payload.map do |row|
          Order.create!(row.to_unsafe_h.slice(*allowed))
        end
      end

      render json: { rows: rows.as_json }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # ------------------------------------------------------------------
    # PATCH /api/orders/update_rows
    #
    # Accepts { rows: [ { id, changes: { ... } }, ... ] }.
    # `changes` only contains the fields that the user edited.
    # ------------------------------------------------------------------
    def update_rows
      payload = Array(params[:rows])
      allowed = Order.column_names - %w[id created_at updated_at]

      updated = Order.transaction do
        payload.map do |row|
          record = Order.find(row[:id])
          changes = row[:changes].to_unsafe_h.slice(*allowed)
          record.update!(changes)
          record
        end
      end

      render json: { rows: updated.as_json }
    rescue ActiveRecord::RecordNotFound => e
      render json: { error: e.message }, status: :not_found
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # ------------------------------------------------------------------
    # DELETE /api/orders/remove_rows
    #
    # Accepts { row_ids: [1, 2, 3] }.
    # Uses delete_all so the whole batch runs in a single SQL statement.
    # Returns 204 No Content on success.
    # ------------------------------------------------------------------
    def remove_rows
      ids = Array(params[:row_ids])
      Order.where(id: ids).delete_all
      head :no_content
    end

    private

    # Translate Handsontable's sort state into ActiveRecord's .reorder() call.
    # Uses .reorder (not .order) so any default_scope ordering is replaced
    # rather than appended, which guarantees a single deterministic sort.
    # The hash form quotes the column name safely.
    # Values that are not on the whitelist are silently ignored -- no SQL
    # is generated for them.
    def apply_sort(scope)
      prop  = params[:sort_prop]
      order = params[:sort_order] == "desc" ? :desc : :asc

      return scope unless SORTABLE_COLUMNS.include?(prop)

      scope.reorder(prop => order)
    end

    # Translate Handsontable's filters[] param into chained .where calls.
    # Each condition is validated against the same whitelist used for sort.
    # Multiple conditions combine with AND.
    #
    # Conditions supported:
    #   contains / not_contains -- case-insensitive substring match (ILIKE)
    #   eq / neq                -- exact match
    #   begins_with / ends_with -- case-insensitive prefix / suffix match
    #   gt / gte / lt / lte     -- numeric comparisons
    #   empty / not_empty       -- checks for NULL or empty string
    def apply_filters(scope)
      filters = params[:filters]
      return scope if filters.blank?

      Array(filters.values).each do |filter|
        prop      = filter[:prop]
        value     = filter[:value]
        condition = filter[:condition].presence || "contains"

        next unless SORTABLE_COLUMNS.include?(prop)

        safe = Order.sanitize_sql_like(value.to_s)
        scope = case condition
                when "contains"     then scope.where("#{prop} ILIKE ?", "%#{safe}%")
                when "not_contains" then scope.where.not("#{prop} ILIKE ?", "%#{safe}%")
                when "eq"           then scope.where(prop => value)
                when "neq"          then scope.where.not(prop => value)
                when "begins_with"  then scope.where("#{prop} ILIKE ?", "#{safe}%")
                when "ends_with"    then scope.where("#{prop} ILIKE ?", "%#{safe}")
                when "gt"           then scope.where("#{prop} > ?", value)
                when "gte"          then scope.where("#{prop} >= ?", value)
                when "lt"           then scope.where("#{prop} < ?", value)
                when "lte"          then scope.where("#{prop} <= ?", value)
                when "empty"
                  string_col?(prop) ? scope.where("#{prop} IS NULL OR #{prop} = ''") : scope.where(prop => nil)
                when "not_empty"
                  string_col?(prop) ? scope.where.not("#{prop} IS NULL OR #{prop} = ''") : scope.where.not(prop => nil)
                else scope
                end
      end

      scope
    end

    def string_col?(prop)
      Order.column_for_attribute(prop)&.type&.in?(%i[string text])
    end
  end
end
