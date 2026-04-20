# config/routes.rb
#
# All routes are mounted under /api so the controller lives in Api::OrdersController
# and the JSON API is clearly separated from any server-rendered views.
#
# only: [:index] keeps the single built-in RESTful route (GET /api/orders)
# and replaces single-resource create/update/destroy with the batch endpoints
# below. Handsontable's dataProvider sends every mutation as an array in a
# single request, so batch endpoints fit its payload shape naturally.
Rails.application.routes.draw do
  namespace :api do
    resources :orders, only: [:index] do
      collection do
        # POST /api/orders/create_rows -- insert many rows in one request
        post :create_rows

        # PATCH /api/orders/update_rows -- update many rows in one request
        patch :update_rows

        # DELETE /api/orders/remove_rows -- delete many rows in one request
        delete :remove_rows
      end
    end
  end
end
