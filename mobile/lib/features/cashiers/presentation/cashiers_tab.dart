import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/snackbar.dart';
import '../../cashier_auth/application/cashier_session_controller.dart';
import '../application/cashiers_providers.dart';
import '../data/cashiers_api.dart';
import '../domain/cashier.dart';
import 'cashier_form_dialog.dart';

class CashiersTab extends ConsumerWidget {
  const CashiersTab({super.key, required this.storeId});
  final String storeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cashiers = ref.watch(cashiersListProvider(storeId));
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Daftar Kasir',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              AppButton(
                label: 'Kasir Baru',
                variant: AppButtonVariant.accent,
                leadingIcon: Icons.add,
                onPressed: () async {
                  final result = await showDialog<Cashier>(
                    context: context,
                    builder: (_) => CashierFormDialog(storeId: storeId),
                  );
                  if (result != null) {
                    ref.invalidate(cashiersListProvider(storeId));
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: cashiers.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => ref.invalidate(cashiersListProvider(storeId)),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyView(
                    message: 'Belum ada kasir.',
                    icon: Icons.badge_outlined,
                  );
                }
                return ListView.separated(
                  padding: EdgeInsets.zero,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) => _CashierRow(
                    storeId: storeId,
                    cashier: items[i],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CashierRow extends ConsumerWidget {
  const _CashierRow({required this.storeId, required this.cashier});
  final String storeId;
  final Cashier cashier;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final initial = cashier.displayName.isNotEmpty
        ? cashier.displayName[0].toUpperCase()
        : '?';
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.muted,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Center(
              child: Text(
                initial,
                style: theme.textTheme.titleMedium,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(cashier.displayName, style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                AppBadge(
                  label: cashier.active ? 'Aktif' : 'Nonaktif',
                  variant: cashier.active
                      ? AppBadgeVariant.success
                      : AppBadgeVariant.secondary,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          AppButton.icon(
            icon: Icons.login,
            variant: AppButtonVariant.outline,
            size: AppButtonSize.iconSm,
            onPressed: cashier.active ? () => _impersonate(context, ref) : null,
          ),
          const SizedBox(width: 4),
          AppButton.icon(
            icon: Icons.edit_outlined,
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.iconSm,
            onPressed: () async {
              final updated = await showDialog<Cashier>(
                context: context,
                builder: (_) => CashierFormDialog(
                  storeId: storeId,
                  initial: cashier,
                ),
              );
              if (updated != null) {
                ref.invalidate(cashiersListProvider(storeId));
              }
            },
          ),
          const SizedBox(width: 4),
          AppButton.icon(
            icon: Icons.delete_outline,
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.iconSm,
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Nonaktifkan ${cashier.displayName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.destructive,
              foregroundColor: AppColors.destructiveFg,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Nonaktifkan'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(cashiersApiProvider).delete(storeId, cashier.id);
      ref.invalidate(cashiersListProvider(storeId));
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }

  Future<void> _impersonate(BuildContext context, WidgetRef ref) async {
    try {
      final session =
          await ref.read(cashiersApiProvider).impersonate(storeId, cashier.id);
      await ref.read(cashierSessionProvider.notifier).adoptToken(session);
      if (context.mounted) context.go('/cashier/home');
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }
}
