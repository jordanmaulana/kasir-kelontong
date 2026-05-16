import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/money_text.dart';
import '../../../core/widgets/snackbar.dart';
import '../../stock/application/stock_providers.dart';
import '../../stock/domain/stock_row.dart';
import '../application/cart_controller.dart';
import '../data/sales_api.dart';
import 'pos_success_dialog.dart';

class PosCartPanel extends ConsumerStatefulWidget {
  const PosCartPanel({super.key});

  @override
  ConsumerState<PosCartPanel> createState() => _PosCartPanelState();
}

class _PosCartPanelState extends ConsumerState<PosCartPanel> {
  final TextEditingController _tenderedCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _tenderedCtrl.dispose();
    super.dispose();
  }

  String? _stockShortageMessage() {
    final cart = ref.read(cartProvider);
    final Map<String, num> stock = {
      for (final row
          in (ref.read(cashierStockProvider).valueOrNull ?? <StockRow>[]))
        row.product.id: row.qty,
    };
    for (final line in cart.lines) {
      final available = stock[line.product.id];
      if (available == null) continue;
      if (line.stockUnits > available) {
        return 'Stok ${line.product.name} kurang';
      }
    }
    return null;
  }

  Future<void> _checkout() async {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) return;
    final tendered = ref.read(tenderedProvider);
    if (tendered < cart.subtotal) {
      showErrorSnack(context, 'Uang diterima kurang');
      return;
    }
    final shortage = _stockShortageMessage();
    if (shortage != null) {
      showErrorSnack(context, shortage);
      return;
    }
    setState(() => _submitting = true);
    try {
      final sale = await ref.read(salesApiProvider).create(
            lines: cart.lines
                .map(
                  (l) => SaleLineInput(
                    productId: l.product.id,
                    qty: l.qty,
                    isBundle: l.isBundle,
                  ),
                )
                .toList(),
            tendered: tendered,
          );
      if (!mounted) return;
      ref.read(cartProvider.notifier).clear();
      ref.read(tenderedProvider.notifier).state = 0;
      _tenderedCtrl.clear();
      ref.invalidate(cashierStockProvider);
      await showDialog<void>(
        context: context,
        builder: (_) => PosSuccessDialog(sale: sale),
      );
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _setTendered(int value) {
    ref.read(tenderedProvider.notifier).state = value;
    _tenderedCtrl.text = value > 0 ? value.toString() : '';
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final tendered = ref.watch(tenderedProvider);
    final change = tendered - cart.subtotal;
    final canPay = !_submitting && cart.lines.isNotEmpty && change >= 0;

    return ColoredBox(
      color: AppColors.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
            color: AppColors.navy,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Keranjang · ${cart.lines.length} item',
                    style: const TextStyle(
                      fontFamily: 'AtkinsonHyperlegible',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.cream,
                    ),
                  ),
                ),
                if (cart.lines.isNotEmpty)
                  TextButton(
                    onPressed: () => ref.read(cartProvider.notifier).clear(),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.cream,
                    ),
                    child: const Text('Kosongkan'),
                  ),
              ],
            ),
          ),
          Expanded(
            child: cart.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.shopping_basket_outlined,
                            size: 40,
                            color: AppColors.mutedFg,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Keranjang kosong',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: AppColors.mutedFg),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.separated(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: cart.lines.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 12, color: AppColors.border),
                    itemBuilder: (context, i) => _CartLineTile(index: i),
                  ),
          ),
          Container(
            color: AppColors.cream,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _RowKV(
                  label: 'Subtotal',
                  value: formatIdr(cart.subtotal),
                  big: true,
                ),
                const SizedBox(height: 12),
                AppInput(
                  label: 'Uang Diterima',
                  hint: '0',
                  controller: _tenderedCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (v) => ref.read(tenderedProvider.notifier).state =
                      int.tryParse(v) ?? 0,
                ),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 2.2,
                  children: [
                    for (final d in idrDenominations)
                      OutlinedButton(
                        onPressed: () => _setTendered(tendered + d),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 40),
                          padding: EdgeInsets.zero,
                          textStyle: const TextStyle(
                            fontFamily: 'AtkinsonHyperlegible',
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: Text(formatIdr(d)),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                AppButton(
                  label: 'Uang Pas',
                  variant: AppButtonVariant.secondary,
                  size: AppButtonSize.sm,
                  expand: true,
                  onPressed: () => _setTendered(cart.subtotal),
                ),
                const SizedBox(height: 12),
                _RowKV(
                  label: 'Kembalian',
                  value: formatIdr(change.clamp(0, 1 << 30)),
                  big: true,
                  highlightColor:
                      change < 0 ? AppColors.destructive : AppColors.success,
                ),
                const SizedBox(height: 14),
                AppButton(
                  label: 'Bayar Sekarang',
                  variant: AppButtonVariant.accent,
                  size: AppButtonSize.xl,
                  expand: true,
                  isLoading: _submitting,
                  onPressed: canPay ? _checkout : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CartLineTile extends ConsumerWidget {
  const _CartLineTile({required this.index});
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final line = ref.watch(cartProvider).lines[index];
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  line.product.name,
                  style: theme.textTheme.titleSmall,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                color: AppColors.mutedFg,
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: () => ref.read(cartProvider.notifier).remove(index),
              ),
            ],
          ),
          if (line.product.hasBundle)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Switch.adaptive(
                    value: line.isBundle,
                    onChanged: (_) =>
                        ref.read(cartProvider.notifier).toggleBundle(index),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    line.isBundle
                        ? (line.product.bundleLabel ?? 'Bundel')
                        : 'Satuan',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          Row(
            children: [
              _QtyButton(
                icon: Icons.remove,
                onTap: () => ref.read(cartProvider.notifier).setQty(
                      index,
                      line.qty - (line.product.isWeighted ? 0.25 : 1),
                    ),
              ),
              SizedBox(
                width: 60,
                child: Text(
                  formatQty(line.qty),
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.tabular,
                ),
              ),
              _QtyButton(
                icon: Icons.add,
                onTap: () => ref.read(cartProvider.notifier).setQty(
                      index,
                      line.qty + (line.product.isWeighted ? 0.25 : 1),
                    ),
              ),
              const Spacer(),
              MoneyText(
                line.lineTotal,
                style: theme.textTheme.titleSmall,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      height: 36,
      child: Material(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onTap,
          child: Icon(icon, size: 18, color: AppColors.navy),
        ),
      ),
    );
  }
}

class _RowKV extends StatelessWidget {
  const _RowKV({
    required this.label,
    required this.value,
    this.big = false,
    this.highlightColor,
  });
  final String label;
  final String value;
  final bool big;
  final Color? highlightColor;

  @override
  Widget build(BuildContext context) {
    final base = big
        ? Theme.of(context).textTheme.titleLarge
        : Theme.of(context).textTheme.titleMedium;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: base),
        Text(
          value,
          style: (base ?? const TextStyle())
              .tabular
              .copyWith(color: highlightColor),
        ),
      ],
    );
  }
}
