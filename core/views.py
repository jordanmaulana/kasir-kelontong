from django.contrib import messages
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.decorators import method_decorator
from django.views import View

from cashier.models import Cashier
from catalog.forms import BarcodeCatalogForm
from catalog.models import BarcodeCatalog
from store.models import Store
from tenant.models import Tenant


class SuperuserRequiredMixin(View):
    @method_decorator(user_passes_test(lambda user: user.is_superuser, login_url="/login/"))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


class AdminLoginView(LoginView):
    template_name = "registration/login.html"
    success_url = "/dashboard/"


class DashboardView(SuperuserRequiredMixin, View):
    def get(self, request):
        ctx = {
            "total_tenants": Tenant.objects.count(),
            "total_stores": Store.objects.count(),
            "total_cashiers": Cashier.objects.count(),
            "active_cashiers": Cashier.objects.filter(active=True).count(),
            "total_users": User.objects.count(),
        }
        return render(request, "dashboard.html", ctx)


class StoresView(SuperuserRequiredMixin, View):
    def get(self, request):
        qs = Store.objects.select_related("tenant").order_by("-created_on")
        paginator = Paginator(qs, 25)
        page = paginator.get_page(request.GET.get("page"))
        return render(request, "stores.html", {"page": page})


class CashiersView(SuperuserRequiredMixin, View):
    def get(self, request):
        qs = Cashier.objects.select_related("store", "store__tenant").order_by("-created_on")
        paginator = Paginator(qs, 25)
        page = paginator.get_page(request.GET.get("page"))
        return render(request, "cashiers.html", {"page": page})


class UsersView(SuperuserRequiredMixin, View):
    def get(self, request):
        qs = User.objects.select_related("profile").order_by("-date_joined")
        paginator = Paginator(qs, 25)
        page = paginator.get_page(request.GET.get("page"))
        return render(request, "users.html", {"page": page})


class CatalogView(SuperuserRequiredMixin, View):
    def get(self, request):
        q = (request.GET.get("q") or "").strip()
        qs = BarcodeCatalog.objects.all().order_by("barcode")
        if q:
            qs = qs.filter(Q(barcode__icontains=q) | Q(name__icontains=q))
        page = Paginator(qs, 25).get_page(request.GET.get("page"))
        return render(request, "catalog.html", {"page": page, "q": q})


class CatalogCreateView(SuperuserRequiredMixin, View):
    def get(self, request):
        return render(
            request, "catalog_form.html", {"form": BarcodeCatalogForm(), "mode": "create"}
        )

    def post(self, request):
        form = BarcodeCatalogForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Catalog entry created.")
            return redirect("catalog")
        return render(request, "catalog_form.html", {"form": form, "mode": "create"})


class CatalogEditView(SuperuserRequiredMixin, View):
    def get(self, request, barcode):
        obj = get_object_or_404(BarcodeCatalog, pk=barcode)
        return render(
            request,
            "catalog_form.html",
            {"form": BarcodeCatalogForm(instance=obj), "mode": "edit", "obj": obj},
        )

    def post(self, request, barcode):
        obj = get_object_or_404(BarcodeCatalog, pk=barcode)
        form = BarcodeCatalogForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
            messages.success(request, "Catalog entry updated.")
            return redirect("catalog")
        return render(request, "catalog_form.html", {"form": form, "mode": "edit", "obj": obj})
