import 'package:flutter/material.dart';

import '../../app/colors.dart';

enum AppBadgeVariant {
  primary,
  secondary,
  outline,
  accent,
  success,
  destructive
}

class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.secondary,
    this.icon,
  });

  final String label;
  final AppBadgeVariant variant;
  final IconData? icon;

  ({Color bg, Color fg, Color border}) _colors() {
    switch (variant) {
      case AppBadgeVariant.primary:
        return (
          bg: AppColors.navy,
          fg: AppColors.cream,
          border: AppColors.navy
        );
      case AppBadgeVariant.secondary:
        return (
          bg: AppColors.secondary,
          fg: AppColors.navy,
          border: AppColors.border
        );
      case AppBadgeVariant.outline:
        return (
          bg: AppColors.surface,
          fg: AppColors.navy,
          border: AppColors.border
        );
      case AppBadgeVariant.accent:
        return (
          bg: AppColors.accent,
          fg: AppColors.accentFg,
          border: AppColors.accent
        );
      case AppBadgeVariant.success:
        return (
          bg: AppColors.success,
          fg: AppColors.successFg,
          border: AppColors.success
        );
      case AppBadgeVariant.destructive:
        return (
          bg: AppColors.destructive,
          fg: AppColors.destructiveFg,
          border: AppColors.destructive
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: c.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: c.fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: 'AtkinsonHyperlegible',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: c.fg,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
