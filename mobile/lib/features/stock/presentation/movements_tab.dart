import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/colors.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../application/stock_providers.dart';
import '../domain/stock_movement.dart';

class MovementsTab extends ConsumerWidget {
  const MovementsTab({super.key, required this.storeId});
  final String storeId;

  AppBadgeVariant _reasonVariant(StockReason r) {
    switch (r) {
      case StockReason.receiving:
        return AppBadgeVariant.success;
      case StockReason.sale:
        return AppBadgeVariant.outline;
      case StockReason.adjustment:
        return AppBadgeVariant.accent;
      case StockReason.voidSale:
        return AppBadgeVariant.destructive;
      case StockReason.unknown:
        return AppBadgeVariant.secondary;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movements = ref.watch(movementsProvider(storeId));
    final dateFmt = DateFormat('dd MMM HH:mm', 'id_ID');
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: movements.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () => ref.invalidate(movementsProvider(storeId)),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyView(
              message: 'Belum ada riwayat stok.',
              icon: Icons.history,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(movementsProvider(storeId)),
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final m = items[i];
                final positive = m.delta >= 0;
                final deltaColor =
                    positive ? AppColors.success : AppColors.destructive;
                return AppCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: deltaColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          positive ? Icons.arrow_upward : Icons.arrow_downward,
                          color: deltaColor,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              m.productName,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            const SizedBox(height: 4),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                AppBadge(
                                  label: reasonLabel(m.reason),
                                  variant: _reasonVariant(m.reason),
                                ),
                                Text(
                                  dateFmt.format(m.createdOn.toLocal()),
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(color: AppColors.mutedFg),
                                ),
                              ],
                            ),
                            if ((m.actorEmail ?? '').isNotEmpty ||
                                (m.note ?? '').isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                [
                                  if ((m.actorEmail ?? '').isNotEmpty)
                                    m.actorEmail,
                                  if ((m.note ?? '').isNotEmpty) m.note,
                                ].whereType<String>().join(' · '),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: AppColors.mutedFg),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        (positive ? '+' : '') + formatQty(m.delta),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(color: deltaColor),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
