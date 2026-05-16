import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/money_text.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/reports_providers.dart';
import '../data/reports_api.dart';

class ReportsTab extends ConsumerStatefulWidget {
  const ReportsTab({super.key, required this.storeId});
  final String storeId;

  @override
  ConsumerState<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends ConsumerState<ReportsTab> {
  late DateTime _from;
  late DateTime _to;
  final _displayFmt = DateFormat('dd MMM yyyy', 'id_ID');

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _from = DateTime(now.year, now.month, 1);
    _to = DateTime(now.year, now.month, now.day);
  }

  Future<void> _pickRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _from, end: _to),
    );
    if (picked != null) {
      setState(() {
        _from = picked.start;
        _to = picked.end;
      });
    }
  }

  Future<void> _export() async {
    try {
      final bytes = await ref.read(reportsApiProvider).exportCsv(
            widget.storeId,
            from: _from,
            to: _to,
          );
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/laporan-${widget.storeId}-${_from.toIso8601String()}-${_to.toIso8601String()}.csv',
      );
      await file.writeAsBytes(bytes);
      await Share.shareXFiles([XFile(file.path)], text: 'Laporan penjualan');
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final report = ref.watch(
      reportProvider(
        ReportRange(
          storeId: widget.storeId,
          from: _from,
          to: _to,
        ),
      ),
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label:
                      '${_displayFmt.format(_from)} – ${_displayFmt.format(_to)}',
                  variant: AppButtonVariant.outline,
                  leadingIcon: Icons.date_range,
                  expand: true,
                  onPressed: _pickRange,
                ),
              ),
              const SizedBox(width: 12),
              AppButton(
                label: 'Ekspor',
                variant: AppButtonVariant.secondary,
                leadingIcon: Icons.download,
                onPressed: _export,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: report.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => setState(() {}),
              ),
              data: (r) {
                return ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            label: 'Transaksi',
                            value: r.summary.count.toString(),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            label: 'Pendapatan',
                            value: formatIdr(r.summary.grossRevenue),
                            accent: true,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _StatCard(
                      label: 'Item Terjual',
                      value: '${formatQty(r.summary.itemsSold)} item',
                      full: true,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Produk Terlaris',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    if (r.topProducts.isEmpty)
                      Text(
                        'Belum ada data.',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppColors.mutedFg),
                      )
                    else
                      for (final p in r.topProducts) ...[
                        AppCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      p.productName,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${formatQty(p.qtySold)} terjual',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(color: AppColors.mutedFg),
                                    ),
                                  ],
                                ),
                              ),
                              MoneyText(
                                p.revenue,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    this.accent = false,
    this.full = false,
  });
  final String label;
  final String value;
  final bool accent;
  final bool full;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label.toUpperCase(),
            style: theme.textTheme.labelSmall,
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: (accent ? AppTextStyles.xl : AppTextStyles.lg)
                .copyWith(
                  color: accent ? AppColors.accent : AppColors.navy,
                )
                .tabular,
          ),
        ],
      ),
    );
  }
}
