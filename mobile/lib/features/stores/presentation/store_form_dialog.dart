import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../data/stores_api.dart';
import '../domain/store.dart';

class StoreFormDialog extends ConsumerStatefulWidget {
  const StoreFormDialog({super.key, this.initial});
  final Store? initial;

  @override
  ConsumerState<StoreFormDialog> createState() => _StoreFormDialogState();
}

class _StoreFormDialogState extends ConsumerState<StoreFormDialog> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _codeCtrl;
  late final TextEditingController _addressCtrl;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initial?.name);
    _codeCtrl = TextEditingController(text: widget.initial?.code);
    _addressCtrl = TextEditingController(text: widget.initial?.address);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _codeCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final api = ref.read(storesApiProvider);
    final name = _nameCtrl.text.trim();
    final code = _codeCtrl.text.trim().toUpperCase();
    final address = _addressCtrl.text.trim();
    if (name.isEmpty || code.isEmpty) {
      showErrorSnack(context, 'Nama & kode wajib diisi');
      return;
    }
    setState(() => _submitting = true);
    try {
      final result = widget.initial == null
          ? await api.create(name: name, code: code, address: address)
          : await api.update(widget.initial!.id, <String, dynamic>{
              'name': name,
              'code': code,
              'address': address,
            });
      if (mounted) Navigator.pop<Store>(context, result);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initial == null ? 'Toko Baru' : 'Edit Toko'),
      content: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppInput(
              label: 'Nama Toko',
              controller: _nameCtrl,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            AppInput(
              label: 'Kode Toko',
              helper: '3–10 karakter huruf/angka',
              controller: _codeCtrl,
              textInputAction: TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
              ],
            ),
            const SizedBox(height: 12),
            AppInput(
              label: 'Alamat',
              controller: _addressCtrl,
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
