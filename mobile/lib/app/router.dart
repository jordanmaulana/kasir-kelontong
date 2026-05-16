import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_controller.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/onboarding_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/cashier_auth/application/cashier_session_controller.dart';
import '../features/cashier_auth/presentation/cashier_home_page.dart';
import '../features/cashier_auth/presentation/cashier_login_page.dart';
import '../features/landing/landing_page.dart';
import '../features/products/presentation/products_page.dart';
import '../features/sales/presentation/pos_page.dart';
import '../features/sales/presentation/sales_today_page.dart';
import '../features/stores/presentation/store_detail_page.dart';
import '../features/stores/presentation/stores_list_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final admin = ref.read(authControllerProvider);
      final cashier = ref.read(cashierSessionProvider);
      final loc = state.matchedLocation;

      final guestPaths = {'/login', '/register', '/cashier'};
      final adminPaths = ['/dashboard', '/onboarding'];
      final cashierPaths = ['/cashier/home', '/cashier/pos'];

      bool isAdminPath() =>
          adminPaths.any((p) => loc == p || loc.startsWith('$p/'));
      bool isCashierPath() =>
          cashierPaths.any((p) => loc == p || loc.startsWith('$p/'));

      if (loc == '/') return null;

      if (isAdminPath() && !admin.isAuthenticated) return '/login';
      if (admin.isAuthenticated &&
          admin.user!.onboarded == false &&
          isAdminPath() &&
          loc != '/onboarding') {
        return '/onboarding';
      }
      if (admin.isAuthenticated &&
          loc == '/onboarding' &&
          admin.user!.onboarded) {
        return '/dashboard';
      }
      if (isCashierPath() && !cashier.isAuthenticated) return '/cashier';
      if (guestPaths.contains(loc)) {
        if (admin.isAuthenticated && loc != '/cashier') return '/dashboard';
        if (cashier.isAuthenticated && loc == '/cashier') {
          return '/cashier/home';
        }
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/', builder: (_, __) => const LandingPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingPage()),
      GoRoute(path: '/dashboard', builder: (_, __) => const StoresListPage()),
      GoRoute(
        path: '/dashboard/products',
        builder: (_, __) => const ProductsPage(),
      ),
      GoRoute(
        path: '/dashboard/stores/:storeId',
        builder: (_, state) =>
            StoreDetailPage(storeId: state.pathParameters['storeId']!),
      ),
      GoRoute(path: '/cashier', builder: (_, __) => const CashierLoginPage()),
      GoRoute(
        path: '/cashier/home',
        builder: (_, __) => const CashierHomePage(),
      ),
      GoRoute(path: '/cashier/pos', builder: (_, __) => const PosPage()),
      GoRoute(
        path: '/cashier/pos/sales',
        builder: (_, __) => const SalesTodayPage(),
      ),
    ],
  );
});
