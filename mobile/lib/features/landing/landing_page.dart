import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/colors.dart';
import '../auth/application/auth_controller.dart';
import '../cashier_auth/application/cashier_session_controller.dart';

class LandingPage extends ConsumerStatefulWidget {
  const LandingPage({super.key});

  @override
  ConsumerState<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends ConsumerState<LandingPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _decide());
  }

  Future<void> _decide() async {
    await Future.wait<void>([
      ref.read(authControllerProvider.notifier).bootstrap(),
      ref.read(cashierSessionProvider.notifier).bootstrap(),
    ]);
    if (!mounted) return;
    final admin = ref.read(authControllerProvider);
    final cashier = ref.read(cashierSessionProvider);
    if (admin.isAuthenticated) {
      if (admin.user!.onboarded) {
        context.go('/dashboard');
      } else {
        context.go('/onboarding');
      }
      return;
    }
    if (cashier.isAuthenticated) {
      context.go('/cashier/home');
      return;
    }
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.navy,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(
                  Icons.store,
                  size: 40,
                  color: AppColors.cream,
                ),
              ),
              const SizedBox(height: 20),
              Text('KasirKelontong', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(
                'Pengelola Toko',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedFg,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 40),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
