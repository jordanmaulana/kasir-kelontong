import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/colors.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/cashier_auth/application/cashier_session_controller.dart';
import 'snackbar.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key, this.currentPath});

  final String? currentPath;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final name = auth.user?.name ?? auth.user?.email ?? 'Pemilik Toko';
    return Drawer(
      backgroundColor: AppColors.cream,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _BrandHeader(tagline: 'Pengelola Toko'),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Text(
                name,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.mutedFg,
                    ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Divider(height: 1),
            const SizedBox(height: 8),
            _NavItem(
              icon: Icons.storefront_outlined,
              label: 'Toko Saya',
              path: '/dashboard',
              currentPath: currentPath,
            ),
            _NavItem(
              icon: Icons.inventory_2_outlined,
              label: 'Produk',
              path: '/dashboard/products',
              currentPath: currentPath,
            ),
            const Spacer(),
            const Divider(height: 1),
            _NavItem(
              icon: Icons.point_of_sale_outlined,
              label: 'Mode Kasir',
              onTap: () => context.go('/cashier'),
            ),
            _NavItem(
              icon: Icons.logout,
              label: 'Keluar',
              destructive: true,
              onTap: () async {
                Navigator.of(context).pop();
                try {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) context.go('/');
                } catch (e) {
                  if (context.mounted) showErrorSnack(context, e);
                }
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class CashierDrawer extends ConsumerWidget {
  const CashierDrawer({super.key, this.currentPath});

  final String? currentPath;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cashier = ref.watch(cashierSessionProvider);
    final session = cashier.session;
    return Drawer(
      backgroundColor: AppColors.cream,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _BrandHeader(tagline: 'Mode Kasir'),
            if (session != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      session.cashier.displayName,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${session.store.name} · ${session.store.code}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.mutedFg,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            const Divider(height: 1),
            const SizedBox(height: 8),
            _NavItem(
              icon: Icons.home_outlined,
              label: 'Beranda',
              path: '/cashier/home',
              currentPath: currentPath,
            ),
            _NavItem(
              icon: Icons.point_of_sale_outlined,
              label: 'POS',
              path: '/cashier/pos',
              currentPath: currentPath,
            ),
            _NavItem(
              icon: Icons.receipt_long_outlined,
              label: 'Penjualan Hari Ini',
              path: '/cashier/pos/sales',
              currentPath: currentPath,
            ),
            const Spacer(),
            const Divider(height: 1),
            _NavItem(
              icon: Icons.logout,
              label: 'Keluar',
              destructive: true,
              onTap: () async {
                Navigator.of(context).pop();
                try {
                  await ref.read(cashierSessionProvider.notifier).logout();
                  if (context.mounted) context.go('/cashier');
                } catch (e) {
                  if (context.mounted) showErrorSnack(context, e);
                }
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({required this.tagline});

  final String tagline;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.navy,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.store, color: AppColors.cream, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'KasirKelontong',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  tagline,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.mutedFg,
                        letterSpacing: 1.2,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    this.path,
    this.currentPath,
    this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final String? path;
  final String? currentPath;
  final VoidCallback? onTap;
  final bool destructive;

  bool get _isActive {
    if (path == null || currentPath == null) return false;
    return currentPath == path ||
        (path != '/' && currentPath!.startsWith('$path/'));
  }

  @override
  Widget build(BuildContext context) {
    final active = _isActive;
    final fg = destructive
        ? AppColors.destructive
        : (active ? AppColors.accentFg : AppColors.navy);
    final bg = active ? AppColors.accent : Colors.transparent;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap ??
              (path == null
                  ? null
                  : () {
                      Navigator.of(context).pop();
                      context.go(path!);
                    }),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(icon, size: 22, color: fg),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontFamily: 'AtkinsonHyperlegible',
                      fontSize: 16,
                      fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                      color: fg,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
