import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../data/stock_api.dart';

class AdjustmentDialog extends ConsumerStatefulWidget {
  const AdjustmentDialog({
    super.key,
    required this.storeId,
    required this.productId,
    required this.productName,
    required this.currentQty,
  });

  final String storeId;
  final String productId;
  final String productName;
  final num currentQty;

  @override
  ConsumerState<AdjustmentDialog> createState() => _AdjustmentDialogState();
}

class _AdjustmentDialogState extends ConsumerState<AdjustmentDialog> {
  final _targetCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _targetCtrl.text = widget.currentQty.toString();
  }

  @override
  void dispose() {
    _targetCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final target = num.tryParse(_targetCtrl.text.trim().replaceAll(',', '.'));
    if (target == null) {
      showErrorSnack(context, 'Qty tidak valid');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(stockApiProvider).adjust(
            widget.storeId,
            productId: widget.productId,
            targetQty: target,
            note: _noteCtrl.text.trim(),
          );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Sesuaikan: ${widget.productName}'),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppInput(
              label: 'Qty Target',
              controller: _targetCtrl,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            AppInput(
              label: 'Catatan',
              controller: _noteCtrl,
              maxLines: 2,
            ),
          ],
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
