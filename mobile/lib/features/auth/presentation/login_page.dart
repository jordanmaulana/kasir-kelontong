import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_input.dart';
import '../../../core/widgets/snackbar.dart';
import '../application/auth_controller.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _submitting = false;
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref
          .read(authControllerProvider.notifier)
          .login(_emailCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      context.go('/dashboard');
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _google() async {
    setState(() => _submitting = true);
    try {
      final account = await GoogleSignIn(scopes: const ['email']).signIn();
      if (account == null) {
        if (mounted) setState(() => _submitting = false);
        return;
      }
      final auth = await account.authentication;
      final credential = auth.idToken ?? auth.accessToken ?? '';
      if (credential.isEmpty) throw Exception('Google credential kosong');
      await ref.read(authControllerProvider.notifier).google(credential);
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
                        Icons.store,
                        color: AppColors.cream,
                        size: 32,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'KasirKelontong',
                    style: theme.textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Masuk untuk mengelola toko Anda',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppColors.mutedFg,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
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
                              label: 'Email',
                              hint: 'kamu@toko.id',
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              validator: (v) => (v == null || !v.contains('@'))
                                  ? 'Email tidak valid'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            AppInput(
                              label: 'Kata Sandi',
                              hint: '••••••',
                              controller: _passwordCtrl,
                              obscureText: _obscure,
                              suffix: IconButton(
                                icon: Icon(
                                  _obscure
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                  color: AppColors.mutedFg,
                                ),
                                onPressed: () =>
                                    setState(() => _obscure = !_obscure),
                              ),
                              onSubmitted: (_) => _submit(),
                              validator: (v) => (v == null || v.isEmpty)
                                  ? 'Wajib diisi'
                                  : null,
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
                            const SizedBox(height: 16),
                            const _Divider(label: 'Atau'),
                            const SizedBox(height: 16),
                            AppButton(
                              label: 'Lanjutkan dengan Google',
                              variant: AppButtonVariant.outline,
                              size: AppButtonSize.lg,
                              leadingIcon: Icons.g_mobiledata,
                              expand: true,
                              onPressed: _submitting ? null : _google,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Belum punya akun? ',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppColors.mutedFg,
                        ),
                      ),
                      AppButton(
                        label: 'Daftar',
                        variant: AppButtonVariant.ghost,
                        size: AppButtonSize.sm,
                        onPressed: () => context.go('/register'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  AppButton(
                    label: 'Saya seorang Kasir',
                    variant: AppButtonVariant.ghost,
                    expand: true,
                    onPressed: () => context.go('/cashier'),
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

class _Divider extends StatelessWidget {
  const _Divider({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.border)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.mutedFg,
                  letterSpacing: 1.2,
                ),
          ),
        ),
        const Expanded(child: Divider(color: AppColors.border)),
      ],
    );
  }
}
