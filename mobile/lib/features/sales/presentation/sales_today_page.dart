import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_shell.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/money_text.dart';
import '../application/sales_providers.dart';

class SalesTodayPage extends ConsumerWidget {
  const SalesTodayPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sales = ref.watch(salesTodayProvider);
    final timeFmt = DateFormat('HH:mm', 'id_ID');
    return CashierShell(
      eyebrow: 'Hari Ini',
      title: 'Penjualan',
      subtitle: 'Riwayat transaksi sesi kasir saat ini.',
      scrollable: false,
      child: sales.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () => ref.invalidate(salesTodayProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyView(
              message: 'Belum ada penjualan hari ini.',
              icon: Icons.receipt_long_outlined,
            );
          }
          final total = items.fold<int>(0, (sum, s) => sum + s.subtotal);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppCard(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Total Kas',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(color: AppColors.mutedFg),
                          ),
                          const SizedBox(height: 6),
                          MoneyText(
                            total,
                            style: AppTextStyles.xl,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${items.length} transaksi',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: AppColors.mutedFg),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.payments,
                        size: 28,
                        color: AppColors.accentFg,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async => ref.invalidate(salesTodayProvider),
                  child: ListView.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final sale = items[i];
                      return AppCard(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.muted,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.receipt_long_outlined,
                                color: AppColors.navy,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${sale.lines.length} item · ${timeFmt.format(sale.createdOn.toLocal())}',
                                    style:
                                        Theme.of(context).textTheme.titleSmall,
                                  ),
                                  if ((sale.cashierName ?? '').isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      sale.cashierName!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: AppColors.mutedFg,
                                          ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            MoneyText(
                              sale.subtotal,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
