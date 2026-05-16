import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../data/products_api.dart';
import '../domain/product.dart';

class ProductFormDialog extends ConsumerStatefulWidget {
  const ProductFormDialog({super.key, this.initial});
  final Product? initial;

  @override
  ConsumerState<ProductFormDialog> createState() => _ProductFormDialogState();
}

class _ProductFormDialogState extends ConsumerState<ProductFormDialog> {
  final _nameCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  final _bundleQtyCtrl = TextEditingController();
  final _bundlePriceCtrl = TextEditingController();
  final _bundleLabelCtrl = TextEditingController();
  final _unitLabelCtrl = TextEditingController();
  bool _weighted = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final p = widget.initial;
    if (p != null) {
      _nameCtrl.text = p.name;
      _priceCtrl.text = p.sellPrice.toString();
      _barcodeCtrl.text = p.barcode ?? '';
      _bundleQtyCtrl.text = p.bundleQty?.toString() ?? '';
      _bundlePriceCtrl.text = p.bundlePrice?.toString() ?? '';
      _bundleLabelCtrl.text = p.bundleLabel ?? '';
      _unitLabelCtrl.text = p.unitLabel ?? '';
      _weighted = p.isWeighted;
    }
  }

  @override
  void dispose() {
    for (final c in [
      _nameCtrl,
      _priceCtrl,
      _barcodeCtrl,
      _bundleQtyCtrl,
      _bundlePriceCtrl,
      _bundleLabelCtrl,
      _unitLabelCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final price = int.tryParse(_priceCtrl.text.trim());
    if (name.isEmpty || price == null) {
      showErrorSnack(context, 'Nama & harga wajib diisi');
      return;
    }
    final bundleQty = int.tryParse(_bundleQtyCtrl.text.trim());
    final bundlePrice = int.tryParse(_bundlePriceCtrl.text.trim());
    final bundleLabel = _bundleLabelCtrl.text.trim();
    if (_weighted && bundleQty != null) {
      showErrorSnack(context, 'Produk timbang tidak boleh punya bundel');
      return;
    }
    final payload = <String, dynamic>{
      'name': name,
      'sell_price': price,
      'barcode': _barcodeCtrl.text.trim(),
      'is_weighted': _weighted,
      'unit_label': _unitLabelCtrl.text.trim(),
      'bundle_qty': bundleQty,
      'bundle_price': bundlePrice,
      'bundle_label': bundleLabel,
    };
    setState(() => _submitting = true);
    try {
      final api = ref.read(productsApiProvider);
      final result = widget.initial == null
          ? await api.create(payload)
          : await api.update(widget.initial!.id, payload);
      if (mounted) Navigator.pop<Product>(context, result);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final digitsOnly = <TextInputFormatter>[
      FilteringTextInputFormatter.digitsOnly,
    ];
    return AlertDialog(
      title: Text(widget.initial == null ? 'Produk Baru' : 'Edit Produk'),
      content: SizedBox(
        width: 560,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppInput(label: 'Nama', controller: _nameCtrl),
              const SizedBox(height: 12),
              AppInput(
                label: 'Harga Jual (IDR)',
                controller: _priceCtrl,
                inputFormatters: digitsOnly,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              AppInput(
                label: 'Barcode',
                helper: 'Opsional',
                controller: _barcodeCtrl,
              ),
              const SizedBox(height: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _weighted,
                  onChanged: (v) => setState(() => _weighted = v),
                  title: const Text('Produk timbang'),
                  subtitle: Text(
                    'Qty bisa desimal, mis. 0.25 kg.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.mutedFg,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              AppInput(
                label: 'Satuan',
                hint: 'kg, gram, liter',
                controller: _unitLabelCtrl,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 1,
                      color: AppColors.border,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'BUNDEL',
                      style: theme.textTheme.labelSmall,
                    ),
                  ),
                  Expanded(
                    child: Container(
                      height: 1,
                      color: AppColors.border,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AppInput(
                      label: 'Qty Bundel',
                      controller: _bundleQtyCtrl,
                      inputFormatters: digitsOnly,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppInput(
                      label: 'Harga Bundel',
                      controller: _bundlePriceCtrl,
                      inputFormatters: digitsOnly,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              AppInput(
                label: 'Label Bundel',
                hint: '12-pak, dus',
                controller: _bundleLabelCtrl,
              ),
            ],
          ),
        ),
      ),
      actions: [
        AppButton(
          label: 'Batal',
          variant: AppButtonVariant.ghost,
          onPressed: () => Navigator.pop(context),
        ),
        AppButton(
          label: 'Simpan',
          variant: AppButtonVariant.accent,
          isLoading: _submitting,
          onPressed: _submit,
        ),
      ],
    );
  }
}
