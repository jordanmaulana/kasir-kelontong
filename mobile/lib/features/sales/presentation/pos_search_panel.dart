import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/money_text.dart';
import '../../products/domain/product.dart';
import '../../stock/application/stock_providers.dart';
import '../../stock/domain/stock_row.dart';
import '../application/cart_controller.dart';
import 'barcode_scanner_sheet.dart';

class PosSearchPanel extends ConsumerStatefulWidget {
  const PosSearchPanel({super.key});

  @override
  ConsumerState<PosSearchPanel> createState() => _PosSearchPanelState();
}

class _PosSearchPanelState extends ConsumerState<PosSearchPanel> {
  final TextEditingController _ctrl = TextEditingController();
  final FocusNode _focus = FocusNode();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _ctrl.addListener(() {
      setState(() => _query = _ctrl.text.trim());
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _onSubmit(String value, List<StockRow> rows) {
    final code = value.trim();
    if (code.isEmpty) return;
    final exact = rows.where((r) => r.product.barcode == code);
    if (exact.isNotEmpty) {
      _add(exact.first.product);
      _ctrl.clear();
      _focus.requestFocus();
    }
  }

  void _add(Product product) {
    ref.read(cartProvider.notifier).addProduct(product);
  }

  Future<void> _scan() async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const BarcodeScannerSheet()),
    );
    if (code == null) return;
    _ctrl.text = code;
    final rows = ref.read(cashierStockProvider).valueOrNull ?? <StockRow>[];
    _onSubmit(code, rows);
  }

  @override
  Widget build(BuildContext context) {
    final stockAsync = ref.watch(cashierStockProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: stockAsync.maybeWhen(
                  data: (rows) => AppInput(
                    label: 'Cari Produk',
                    hint: 'Scan barcode atau ketik nama',
                    controller: _ctrl,
                    focusNode: _focus,
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    inputFormatters: [LengthLimitingTextInputFormatter(64)],
                    prefixIcon: Icons.search,
                    onSubmitted: (v) => _onSubmit(v, rows),
                  ),
                  orElse: () => const AppInput(
                    label: 'Cari Produk',
                    hint: 'Memuat stok…',
                    prefixIcon: Icons.search,
                    enabled: false,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 0),
                child: AppButton.icon(
                  icon: Icons.qr_code_scanner,
                  variant: AppButtonVariant.outline,
                  size: AppButtonSize.iconLg,
                  onPressed: _scan,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: stockAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => Center(child: Text(e.toString())),
              data: (rows) {
                final filtered = _query.isEmpty
                    ? rows
                    : rows.where((r) {
                        final q = _query.toLowerCase();
                        return r.product.name.toLowerCase().contains(q) ||
                            (r.product.barcode ?? '').contains(q);
                      }).toList();
                if (filtered.isEmpty) {
                  return const EmptyView(
                    message: 'Produk tidak ditemukan',
                    icon: Icons.search_off,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(cashierStockProvider),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 260,
                      mainAxisExtent: 140,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final row = filtered[i];
                      return _ProductTile(
                        row: row,
                        onAdd: (asBundle) {
                          ref.read(cartProvider.notifier).addProduct(
                                row.product,
                                asBundle: asBundle,
                              );
                        },
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

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.row, required this.onAdd});
  final StockRow row;
  final void Function(bool asBundle) onAdd;

  @override
  Widget build(BuildContext context) {
    final p = row.product;
    final theme = Theme.of(context);
    final lowStock = row.qty <= 0;
    return Card(
      child: InkWell(
        onTap: () => onAdd(false),
        onLongPress: p.hasBundle ? () => onAdd(true) : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                p.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleSmall,
              ),
              const Spacer(),
              MoneyText(
                p.sellPrice,
                style: AppTextStyles.lg.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Stok ${formatQty(row.qty)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: lowStock
                            ? AppColors.destructive
                            : AppColors.mutedFg,
                        fontWeight:
                            lowStock ? FontWeight.w700 : FontWeight.w400,
                      ),
                    ),
                  ),
                  if (p.hasBundle)
                    AppBadge(
                      label: p.bundleLabel ?? 'Bundel',
                      variant: AppBadgeVariant.accent,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
