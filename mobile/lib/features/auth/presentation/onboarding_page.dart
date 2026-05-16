import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/page_title.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/auth_controller.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _codeCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(authControllerProvider.notifier).completeOnboarding(
            name: _nameCtrl.text.trim(),
            code: _codeCtrl.text.trim().toUpperCase(),
            address: _addressCtrl.text.trim(),
          );
      if (!mounted) return;
      context.go('/dashboard');
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                const PageTitle(
                  eyebrow: 'Mulai',
                  title: 'Siapkan Toko Pertama',
                  subtitle: 'Beri nama toko, kode unik, dan alamat lengkap.',
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          AppInput(
                            label: 'Nama Toko',
                            hint: 'Toko Berkah',
                            controller: _nameCtrl,
                            textInputAction: TextInputAction.next,
                            validator: (v) => (v == null || v.trim().isEmpty)
                                ? 'Wajib diisi'
                                : null,
                          ),
                          const SizedBox(height: 16),
                          AppInput(
                            label: 'Kode Toko',
                            hint: 'DEMO',
                            helper: '3–10 karakter huruf/angka',
                            controller: _codeCtrl,
                            textInputAction: TextInputAction.next,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                RegExp(r'[A-Za-z0-9]'),
                              ),
                            ],
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Wajib diisi';
                              }
                              if (!RegExp(r'^[A-Z0-9]{3,10}$')
                                  .hasMatch(v.trim().toUpperCase())) {
                                return 'Hanya huruf/angka, 3–10 karakter';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppInput(
                            label: 'Alamat',
                            hint: 'Jl. Mawar No. 12',
                            controller: _addressCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 24),
                          AppButton(
                            label: 'Selesai',
                            variant: AppButtonVariant.accent,
                            size: AppButtonSize.lg,
                            expand: true,
                            isLoading: _submitting,
                            onPressed: _submit,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
