import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasir_kelontong/features/products/data/products_api.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/snackbar.dart';
import '../../products/domain/product.dart';
import '../application/stock_providers.dart';
import '../data/stock_api.dart';

class _Line {
  final Product product;
  num qty;
  String note;

  _Line({required this.product, required this.qty, required this.note});
}

class ReceivingTab extends ConsumerStatefulWidget {
  const ReceivingTab({super.key, required this.storeId});
  final String storeId;

  @override
  ConsumerState<ReceivingTab> createState() => _ReceivingTabState();
}

class _ReceivingTabState extends ConsumerState<ReceivingTab> {
  final List<_Line> _lines = [];
  bool _submitting = false;

  Future<void> _addProduct() async {
    final products = await ref.read(productsApiProvider).list();
    if (!mounted) return;
    final picked = await showDialog<Product>(
      context: context,
      builder: (_) => SimpleDialog(
        title: const Text('Pilih produk'),
        children: products
            .map(
              (p) => SimpleDialogOption(
                onPressed: () => Navigator.pop(context, p),
                child: ListTile(
                  title: Text(p.name),
                  subtitle: Text(p.barcode ?? '-'),
                ),
              ),
            )
            .toList(),
      ),
    );
    if (picked == null) return;
    setState(() => _lines.add(_Line(product: picked, qty: 1, note: '')));
  }

  Future<void> _submit() async {
    if (_lines.isEmpty) return;
    setState(() => _submitting = true);
    try {
      await ref.read(stockApiProvider).receiving(
            widget.storeId,
            _lines
                .map(
                  (l) => <String, dynamic>{
                    'product_id': l.product.id,
                    'qty': l.qty,
                    if (l.note.isNotEmpty) 'note': l.note,
                  },
                )
                .toList(),
          );
      if (!mounted) return;
      showSuccessSnack(context, 'Kulakan tersimpan');
      setState(_lines.clear);
      ref.invalidate(adminStockProvider(widget.storeId));
      ref.invalidate(movementsProvider(widget.storeId));
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${_lines.length} item',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              AppButton(
                label: 'Tambah Produk',
                variant: AppButtonVariant.outline,
                leadingIcon: Icons.add,
                onPressed: _addProduct,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _lines.isEmpty
                ? const EmptyView(
                    message: 'Tambahkan produk yang Anda terima dari supplier.',
                    icon: Icons.local_shipping_outlined,
                  )
                : ListView.separated(
                    padding: EdgeInsets.zero,
                    itemCount: _lines.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) => _ReceivingRow(
                      line: _lines[i],
                      onRemove: () => setState(() => _lines.removeAt(i)),
                      onChanged: () => setState(() {}),
                    ),
                  ),
          ),
          if (_lines.isNotEmpty) ...[
            const SizedBox(height: 12),
            AppButton(
              label: 'Simpan Kulakan',
              variant: AppButtonVariant.accent,
              size: AppButtonSize.lg,
              expand: true,
              isLoading: _submitting,
              onPressed: _submit,
            ),
          ],
        ],
      ),
    );
  }
}

class _ReceivingRow extends StatelessWidget {
  const _ReceivingRow({
    required this.line,
    required this.onRemove,
    required this.onChanged,
  });
  final _Line line;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  line.product.name,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                color: AppColors.mutedFg,
                onPressed: onRemove,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: AppInput(
                  label: 'Qty',
                  initialValue: line.qty.toString(),
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                  ],
                  onChanged: (v) {
                    line.qty = num.tryParse(v.replaceAll(',', '.')) ?? 0;
                    onChanged();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: AppInput(
                  label: 'Catatan',
                  initialValue: line.note,
                  onChanged: (v) => line.note = v,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
