import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../data/cashiers_api.dart';
import '../domain/cashier.dart';

class CashierFormDialog extends ConsumerStatefulWidget {
  const CashierFormDialog({super.key, required this.storeId, this.initial});
  final String storeId;
  final Cashier? initial;

  @override
  ConsumerState<CashierFormDialog> createState() => _CashierFormDialogState();
}

class _CashierFormDialogState extends ConsumerState<CashierFormDialog> {
  final _nameCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = widget.initial?.displayName ?? '';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final pin = _pinCtrl.text.trim();
    if (name.isEmpty) {
      showErrorSnack(context, 'Nama wajib diisi');
      return;
    }
    if (widget.initial == null && pin.length < 4) {
      showErrorSnack(context, 'PIN minimal 4 digit');
      return;
    }
    setState(() => _submitting = true);
    try {
      final api = ref.read(cashiersApiProvider);
      final result = widget.initial == null
          ? await api.create(widget.storeId, displayName: name, pin: pin)
          : await api.update(
              widget.storeId,
              widget.initial!.id,
              <String, dynamic>{
                'display_name': name,
                if (pin.isNotEmpty) 'pin': pin,
              },
            );
      if (mounted) Navigator.pop<Cashier>(context, result);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initial == null ? 'Kasir Baru' : 'Edit Kasir'),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppInput(
              label: 'Nama',
              controller: _nameCtrl,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            AppInput(
              label: widget.initial == null
                  ? 'PIN (4–6 digit)'
                  : 'PIN baru (opsional)',
              controller: _pinCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              maxLength: 6,
              obscureText: true,
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
