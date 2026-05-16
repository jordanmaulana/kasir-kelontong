import 'package:flutter/material.dart';

import '../../app/colors.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    this.title,
    this.description,
    this.trailing,
    this.eyebrow,
    this.footer,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
    required this.child,
  });

  final String? title;
  final String? description;
  final String? eyebrow;
  final Widget? trailing;
  final Widget? footer;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Widget child;

  bool get _hasHeader =>
      title != null ||
      description != null ||
      eyebrow != null ||
      trailing != null;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_hasHeader) ...[
          _Header(
            title: title,
            description: description,
            eyebrow: eyebrow,
            trailing: trailing,
          ),
          const SizedBox(height: 16),
        ],
        child,
        if (footer != null) ...[
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),
          DefaultTextStyle.merge(
            style: theme.textTheme.bodyMedium ?? const TextStyle(),
            child: footer!,
          ),
        ],
      ],
    );

    final card = Card(
      child: Padding(padding: padding, child: content),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: card,
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({this.title, this.description, this.eyebrow, this.trailing});

  final String? title;
  final String? description;
  final String? eyebrow;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
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
                const SizedBox(height: 6),
              ],
              if (title != null)
                Text(title!, style: theme.textTheme.titleLarge),
              if (description != null) ...[
                const SizedBox(height: 4),
                Text(
                  description!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.mutedFg,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: 12),
          trailing!,
        ],
      ],
    );
  }
}
