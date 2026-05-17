from django.urls import path

from api.v1 import (
    auth_api,
    cashier_auth_api,
    cashiers_api,
    catalog_api,
    payments_api,
    products_api,
    sales_api,
    stock_api,
    stores_api,
)

urlpatterns = [
    path("auth/register/", auth_api.register, name="api-v1-auth-register"),
    path("auth/login/", auth_api.login, name="api-v1-auth-login"),
    path("auth/google/", auth_api.google, name="api-v1-auth-google"),
    path("auth/logout/", auth_api.logout, name="api-v1-logout"),
    path("auth/me/", auth_api.me, name="api-v1-me"),
    path("auth/onboarding/", auth_api.complete_onboarding, name="api-v1-auth-onboarding"),
    path(
        "auth/cashier-login/",
        cashier_auth_api.cashier_login,
        name="api-v1-cashier-login",
    ),
    path(
        "auth/cashier-logout/",
        cashier_auth_api.cashier_logout,
        name="api-v1-cashier-logout",
    ),
    path(
        "auth/cashier-me/",
        cashier_auth_api.cashier_me,
        name="api-v1-cashier-me",
    ),
    path("stores/", stores_api.StoresView.as_view(), name="api-v1-stores"),
    path(
        "stores/<str:store_id>/", stores_api.StoreDetailView.as_view(), name="api-v1-store-detail"
    ),
    path(
        "stores/<str:store_id>/cashiers/",
        cashiers_api.CashiersView.as_view(),
        name="api-v1-cashiers",
    ),
    path(
        "stores/<str:store_id>/cashiers/<str:cashier_id>/",
        cashiers_api.CashierDetailView.as_view(),
        name="api-v1-cashier-detail",
    ),
    path(
        "stores/<str:store_id>/cashiers/<str:cashier_id>/impersonate/",
        cashiers_api.CashierImpersonateView.as_view(),
        name="api-v1-cashier-impersonate",
    ),
    path("barcode-lookup/", catalog_api.barcode_lookup, name="api-v1-barcode-lookup"),
    path("products/", products_api.ProductsView.as_view(), name="api-v1-products"),
    path(
        "products/<str:product_id>/",
        products_api.ProductDetailView.as_view(),
        name="api-v1-product-detail",
    ),
    path(
        "stores/<str:store_id>/stock/",
        stock_api.StoreStockView.as_view(),
        name="api-v1-store-stock",
    ),
    path(
        "stores/<str:store_id>/stock/movements/",
        stock_api.StoreMovementsView.as_view(),
        name="api-v1-store-movements",
    ),
    path(
        "stores/<str:store_id>/receiving/",
        stock_api.StoreReceivingView.as_view(),
        name="api-v1-store-receiving",
    ),
    path(
        "stores/<str:store_id>/adjustments/",
        stock_api.StoreAdjustmentView.as_view(),
        name="api-v1-store-adjustment",
    ),
    path(
        "stores/<str:store_id>/sales/report/",
        sales_api.store_sales_report,
        name="api-v1-store-sales-report",
    ),
    path(
        "cashier/stock/",
        stock_api.CashierStockView.as_view(),
        name="api-v1-cashier-stock",
    ),
    path(
        "cashier/sales/",
        sales_api.create_sale_view,
        name="api-v1-cashier-sales-create",
    ),
    path(
        "cashier/sales/today/",
        sales_api.list_my_sales_today,
        name="api-v1-cashier-sales-today",
    ),
    path("payments/mayar/webhook/", payments_api.webhook, name="api-v1-mayar-webhook"),
]
