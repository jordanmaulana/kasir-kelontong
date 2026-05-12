from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.core.paginator import Paginator
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views import View


class SuperuserRequiredMixin(View):
    @method_decorator(user_passes_test(lambda user: user.is_superuser, login_url="/login/"))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


class AdminLoginView(LoginView):
    template_name = "registration/login.html"
    success_url = "/dashboard/"


class DashboardView(SuperuserRequiredMixin, View):
    def get(self, request):
        ctx = {}
        return render(request, "dashboard.html", ctx)


class UsersView(SuperuserRequiredMixin, View):
    def get(self, request):
        qs = User.objects.select_related("profile").order_by("-date_joined")
        paginator = Paginator(qs, 25)
        page = paginator.get_page(request.GET.get("page"))
        return render(request, "users.html", {"page": page})
