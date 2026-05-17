from django.contrib import admin
from django.contrib.auth.views import LogoutView
from django.urls import include, path
from django.views.generic import RedirectView

from core.views import (
    AdminLoginView,
    CashiersView,
    CatalogCreateView,
    CatalogEditView,
    CatalogView,
    DashboardView,
    StoresView,
    UsersView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("login/", AdminLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(next_page="login"), name="logout"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("stores/", StoresView.as_view(), name="stores"),
    path("cashiers/", CashiersView.as_view(), name="cashiers"),
    path("users/", UsersView.as_view(), name="users"),
    path("catalog/", CatalogView.as_view(), name="catalog"),
    path("catalog/new/", CatalogCreateView.as_view(), name="catalog_new"),
    path("catalog/<str:barcode>/edit/", CatalogEditView.as_view(), name="catalog_edit"),
    path("api/v1/", include("api.v1.urls")),
    path("", RedirectView.as_view(url="/dashboard/", permanent=False), name="home"),
]
