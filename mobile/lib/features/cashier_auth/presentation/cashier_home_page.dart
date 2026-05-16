import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_shell.dart';
import '../application/cashier_session_controller.dart';

class CashierHomePage extends ConsumerWidget {
  const CashierHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(cashierSessionProvider);
    final session = state.session;
    final storeName = session?.store.name ?? 'Toko';
    final cashierName = session?.cashier.displayName ?? '';
    return CashierShell(
      eyebrow: cashierName.isNotEmpty ? 'Halo, $cashierName' : null,
      title: storeName,
      subtitle: 'Pilih aksi untuk memulai sesi kasir.',
      scrollable: false,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 720),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            _ActionTile(
              icon: Icons.point_of_sale,
              title: 'Buka POS',
              description: 'Mulai transaksi penjualan baru.',
              accent: true,
              onTap: () => context.go('/cashier/pos'),
            ),
            const SizedBox(height: 16),
            _ActionTile(
              icon: Icons.receipt_long,
              title: 'Penjualan Hari Ini',
              description: 'Lihat ringkasan transaksi & total kas.',
              onTap: () => context.go('/cashier/pos/sales'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.accent = false,
  });

  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: accent ? AppColors.accent : AppColors.muted,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 28,
              color: accent ? AppColors.accentFg : AppColors.navy,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: theme.textTheme.titleLarge),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.mutedFg,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: AppColors.mutedFg),
        ],
      ),
    );
  }
}
