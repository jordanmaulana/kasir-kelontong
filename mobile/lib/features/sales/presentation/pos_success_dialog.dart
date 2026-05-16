import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/colors.dart';
import '../../../app/text_styles.dart';
import '../../../core/money.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/money_text.dart';
import '../domain/sale.dart';

class PosSuccessDialog extends StatelessWidget {
  const PosSuccessDialog({super.key, required this.sale});
  final Sale sale;

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd MMM yyyy HH:mm', 'id_ID');
    final theme = Theme.of(context);
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.success,
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: const Icon(
                    Icons.check,
                    color: AppColors.successFg,
                    size: 36,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'Pembayaran Berhasil',
                  style: theme.textTheme.headlineMedium,
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  dateFmt.format(sale.createdOn.toLocal()),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.mutedFg,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  'ID ${sale.id}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedFg,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Divider(color: AppColors.border),
              const SizedBox(height: 8),
              for (final line in sale.lines)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              line.productName,
                              style: theme.textTheme.bodyLarge,
                            ),
                            Text(
                              '${formatQty(line.qty)}'
                              '${line.isBundle && line.bundleLabel != null ? " · ${line.bundleLabel}" : ""}'
                              ' × ${formatIdr(line.unitPrice)}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: AppColors.mutedFg,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      MoneyText(
                        line.lineTotal,
                        style: theme.textTheme.bodyLarge,
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 8),
              const Divider(color: AppColors.border),
              const SizedBox(height: 12),
              _Row(label: 'Subtotal', value: sale.subtotal),
              const SizedBox(height: 6),
              _Row(label: 'Uang Diterima', value: sale.tendered),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Kembalian', style: theme.textTheme.titleMedium),
                  MoneyText(
                    sale.change,
                    style: AppTextStyles.lg.copyWith(
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Selesai',
                variant: AppButtonVariant.accent,
                size: AppButtonSize.lg,
                expand: true,
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyMedium),
        MoneyText(value, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
