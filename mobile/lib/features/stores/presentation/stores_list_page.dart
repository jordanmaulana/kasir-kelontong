import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_shell.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/stores_providers.dart';
import '../data/stores_api.dart';
import '../domain/store.dart';
import 'store_form_dialog.dart';

class StoresListPage extends ConsumerWidget {
  const StoresListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stores = ref.watch(storesListProvider);
    return AppShell(
      eyebrow: 'Dashboard',
      title: 'Toko Saya',
      subtitle: 'Kelola toko, stok, kasir, dan laporan harian.',
      action: AppButton(
        label: 'Toko Baru',
        variant: AppButtonVariant.accent,
        leadingIcon: Icons.add,
        onPressed: () => _openCreate(context, ref),
      ),
      scrollable: false,
      child: stores.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () => ref.invalidate(storesListProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyView(
              message: 'Belum ada toko. Tambahkan toko pertama Anda.',
              icon: Icons.storefront_outlined,
            );
          }
          return ListView.separated(
            padding: EdgeInsets.zero,
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) => _StoreCard(store: items[i]),
          );
        },
      ),
    );
  }

  Future<void> _openCreate(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<Store>(
      context: context,
      builder: (_) => const StoreFormDialog(),
    );
    if (result != null) ref.invalidate(storesListProvider);
  }
}

class _StoreCard extends ConsumerWidget {
  const _StoreCard({required this.store});
  final Store store;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return AppCard(
      onTap: () => context.go('/dashboard/stores/${store.id}'),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.muted,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.storefront,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        store.name,
                        style: theme.textTheme.titleMedium,
                      ),
                    ),
                    AppBadge(
                      label: store.code,
                      variant: AppBadgeVariant.secondary,
                    ),
                  ],
                ),
                if ((store.address ?? '').isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    store.address!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.mutedFg,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    AppButton(
                      label: 'Ubah',
                      variant: AppButtonVariant.outline,
                      size: AppButtonSize.sm,
                      leadingIcon: Icons.edit_outlined,
                      onPressed: () async {
                        final updated = await showDialog<Store>(
                          context: context,
                          builder: (_) => StoreFormDialog(initial: store),
                        );
                        if (updated != null) {
                          ref.invalidate(storesListProvider);
                        }
                      },
                    ),
                    const SizedBox(width: 8),
                    AppButton(
                      label: 'Hapus',
                      variant: AppButtonVariant.ghost,
                      size: AppButtonSize.sm,
                      leadingIcon: Icons.delete_outline,
                      onPressed: () => _confirmDelete(context, ref),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Hapus ${store.name}?'),
        content: const Text(
          'Toko & data terkait tidak akan bisa dipulihkan.',
        ),
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
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(storesApiProvider).delete(store.id);
      ref.invalidate(storesListProvider);
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }
}
