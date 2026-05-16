import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/app_shell.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/money_text.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/products_providers.dart';
import '../data/products_api.dart';
import '../domain/product.dart';
import 'product_form_dialog.dart';

class ProductsPage extends ConsumerWidget {
  const ProductsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productsListProvider);
    return AppShell(
      eyebrow: 'Katalog',
      title: 'Produk',
      subtitle: 'Kelola produk, harga, bundel, dan barcode.',
      action: AppButton(
        label: 'Produk Baru',
        variant: AppButtonVariant.accent,
        leadingIcon: Icons.add,
        onPressed: () async {
          final result = await showDialog<Product>(
            context: context,
            builder: (_) => const ProductFormDialog(),
          );
          if (result != null) ref.invalidate(productsListProvider);
        },
      ),
      scrollable: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppInput(
            hint: 'Cari nama atau barcode',
            prefixIcon: Icons.search,
            onChanged: (v) =>
                ref.read(productsQueryProvider.notifier).state = v,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: products.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => ref.invalidate(productsListProvider),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyView(
                    message: 'Belum ada produk.',
                    icon: Icons.inventory_2_outlined,
                  );
                }
                return ListView.separated(
                  padding: EdgeInsets.zero,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) => _ProductRow(product: items[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductRow extends ConsumerWidget {
  const _ProductRow({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.muted,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.inventory_2, color: AppColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(product.name, style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                MoneyText(
                  product.sellPrice,
                  style: AppTextStyles.base.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if ((product.barcode ?? '').isNotEmpty)
                      AppBadge(
                        label: product.barcode!,
                        variant: AppBadgeVariant.outline,
                        icon: Icons.qr_code,
                      ),
                    if (product.hasBundle)
                      AppBadge(
                        label:
                            product.bundleLabel ?? '${product.bundleQty}-pak',
                        variant: AppBadgeVariant.accent,
                      ),
                    if (product.isWeighted)
                      const AppBadge(
                        label: 'Timbang',
                        variant: AppBadgeVariant.secondary,
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppButton.icon(
                icon: Icons.edit_outlined,
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.iconSm,
                onPressed: () async {
                  final updated = await showDialog<Product>(
                    context: context,
                    builder: (_) => ProductFormDialog(initial: product),
                  );
                  if (updated != null) {
                    ref.invalidate(productsListProvider);
                  }
                },
              ),
              const SizedBox(height: 4),
              AppButton.icon(
                icon: Icons.delete_outline,
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.iconSm,
                onPressed: () => _confirmDelete(context, ref),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Hapus ${product.name}?'),
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
      await ref.read(productsApiProvider).delete(product.id);
      ref.invalidate(productsListProvider);
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }
}
