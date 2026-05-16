import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/cashier_session_controller.dart';

class CashierLoginPage extends ConsumerStatefulWidget {
  const CashierLoginPage({super.key});

  @override
  ConsumerState<CashierLoginPage> createState() => _CashierLoginPageState();
}

class _CashierLoginPageState extends ConsumerState<CashierLoginPage> {
  final _storeCodeCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _storeCodeCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _storeCodeCtrl.text.trim().toUpperCase();
    final pin = _pinCtrl.text;
    if (code.isEmpty || pin.length < 4) {
      showErrorSnack(context, 'Kode toko & PIN wajib diisi');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(cashierSessionProvider.notifier).login(code, pin);
      if (!mounted) return;
      context.go('/cashier/home');
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppColors.navy,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.point_of_sale,
                        color: AppColors.cream,
                        size: 32,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Masuk Kasir',
                    style: theme.textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Gunakan kode toko & PIN kasir',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppColors.mutedFg,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AppInput(
                            label: 'Kode Toko',
                            hint: 'DEMO',
                            controller: _storeCodeCtrl,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                RegExp(r'[A-Za-z0-9]'),
                              ),
                            ],
                            textInputAction: TextInputAction.next,
                          ),
                          const SizedBox(height: 16),
                          AppInput(
                            label: 'PIN',
                            hint: '••••',
                            controller: _pinCtrl,
                            obscureText: true,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            maxLength: 6,
                            onSubmitted: (_) => _submit(),
                          ),
                          const SizedBox(height: 24),
                          AppButton(
                            label: 'Masuk',
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
                  const SizedBox(height: 16),
                  AppButton(
                    label: 'Saya seorang Admin',
                    variant: AppButtonVariant.ghost,
                    expand: true,
                    onPressed: () => context.go('/login'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
