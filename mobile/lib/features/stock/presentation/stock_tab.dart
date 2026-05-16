import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/colors.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/money_text.dart';
import '../application/stock_providers.dart';
import 'adjustment_dialog.dart';

class StockTab extends ConsumerWidget {
  const StockTab({super.key, required this.storeId});
  final String storeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stock = ref.watch(adminStockProvider(storeId));
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppInput(
            hint: 'Cari produk',
            prefixIcon: Icons.search,
            onChanged: (v) => ref.read(stockQueryProvider.notifier).state = v,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: stock.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => ref.invalidate(adminStockProvider(storeId)),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyView(
                    message: 'Belum ada stok.',
                    icon: Icons.inventory_outlined,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(adminStockProvider(storeId)),
                  child: ListView.separated(
                    padding: EdgeInsets.zero,
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final row = items[i];
                      final low = row.qty <= 0;
                      return AppCard(
                        padding: const EdgeInsets.all(14),
                        onTap: () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (_) => AdjustmentDialog(
                              storeId: storeId,
                              productId: row.product.id,
                              productName: row.product.name,
                              currentQty: row.qty,
                            ),
                          );
                          if (ok == true) {
                            ref.invalidate(adminStockProvider(storeId));
                          }
                        },
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    row.product.name,
                                    style:
                                        Theme.of(context).textTheme.titleSmall,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    row.product.barcode ?? '-',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(color: AppColors.mutedFg),
                                  ),
                                  const SizedBox(height: 4),
                                  MoneyText(
                                    row.product.sellPrice,
                                    style:
                                        Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  formatQty(row.qty),
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(
                                        color: low
                                            ? AppColors.destructive
                                            : AppColors.navy,
                                      ),
                                ),
                                Text(
                                  row.product.unitLabel ?? 'pcs',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(color: AppColors.mutedFg),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
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
