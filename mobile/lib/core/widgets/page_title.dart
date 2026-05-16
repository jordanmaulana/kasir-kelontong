import 'package:flutter/material.dart';

import '../../app/colors.dart';

class PageTitle extends StatelessWidget {
  const PageTitle({
    super.key,
    this.eyebrow,
    required this.title,
    this.subtitle,
    this.action,
  });

  final String? eyebrow;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (eyebrow != null) ...[
                Text(
                  eyebrow!.toUpperCase(),
                  style: theme.textTheme.labelSmall,
                ),
                const SizedBox(height: 8),
              ],
              Text(
                title,
                style: theme.textTheme.headlineMedium,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 6),
                Text(
                  subtitle!,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: AppColors.mutedFg,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: 12),
          action!,
        ],
      ],
    );
  }
}
