import 'package:flutter/material.dart';

import '../../app/colors.dart';

enum AppButtonVariant {
  primary,
  accent,
  outline,
  secondary,
  ghost,
  destructive
}

enum AppButtonSize { sm, md, lg, xl, icon, iconSm, iconLg }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.leadingIcon,
    this.trailingIcon,
    this.isLoading = false,
    this.expand = false,
  });

  const AppButton.icon({
    super.key,
    required IconData icon,
    this.onPressed,
    this.variant = AppButtonVariant.ghost,
    this.size = AppButtonSize.icon,
    this.isLoading = false,
  })  : label = '',
        leadingIcon = icon,
        trailingIcon = null,
        expand = false;

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final bool isLoading;
  final bool expand;

  bool get _isIcon =>
      size == AppButtonSize.icon ||
      size == AppButtonSize.iconSm ||
      size == AppButtonSize.iconLg;

  double get _height {
    switch (size) {
      case AppButtonSize.sm:
        return 40;
      case AppButtonSize.md:
        return 48;
      case AppButtonSize.lg:
        return 56;
      case AppButtonSize.xl:
        return 64;
      case AppButtonSize.icon:
        return 48;
      case AppButtonSize.iconSm:
        return 40;
      case AppButtonSize.iconLg:
        return 56;
    }
  }

  EdgeInsets get _padding {
    if (_isIcon) return EdgeInsets.zero;
    switch (size) {
      case AppButtonSize.sm:
        return const EdgeInsets.symmetric(horizontal: 14, vertical: 8);
      case AppButtonSize.md:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 12);
      case AppButtonSize.lg:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 14);
      case AppButtonSize.xl:
        return const EdgeInsets.symmetric(horizontal: 28, vertical: 18);
      default:
        return EdgeInsets.zero;
    }
  }

  double get _fontSize {
    switch (size) {
      case AppButtonSize.sm:
        return 14;
      case AppButtonSize.xl:
        return 18;
      default:
        return 16;
    }
  }

  @override
  Widget build(BuildContext context) {
    final disabled = isLoading || onPressed == null;
    final child = _buildChild();
    Widget btn;

    switch (variant) {
      case AppButtonVariant.primary:
        btn = FilledButton(
          onPressed: disabled ? null : onPressed,
          style: _baseStyle(
            bg: AppColors.navy,
            fg: AppColors.cream,
          ),
          child: child,
        );
      case AppButtonVariant.accent:
        btn = DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            boxShadow: disabled
                ? const []
                : const [
                    BoxShadow(
                      color: AppColors.accentShadow,
                      offset: Offset(0, 2),
                      blurRadius: 0,
                    ),
                  ],
          ),
          child: FilledButton(
            onPressed: disabled ? null : onPressed,
            style: _baseStyle(
              bg: AppColors.accent,
              fg: AppColors.accentFg,
            ),
            child: child,
          ),
        );
      case AppButtonVariant.outline:
        btn = OutlinedButton(
          onPressed: disabled ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.navy,
            backgroundColor: AppColors.surface,
            side: const BorderSide(color: AppColors.navy, width: 1.5),
            minimumSize: Size(_isIcon ? _height : 0, _height),
            fixedSize: _isIcon ? Size(_height, _height) : null,
            padding: _padding,
            textStyle: TextStyle(
              fontFamily: 'AtkinsonHyperlegible',
              fontSize: _fontSize,
              fontWeight: FontWeight.w700,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: child,
        );
      case AppButtonVariant.secondary:
        btn = FilledButton(
          onPressed: disabled ? null : onPressed,
          style: _baseStyle(
            bg: AppColors.secondary,
            fg: AppColors.navy,
          ),
          child: child,
        );
      case AppButtonVariant.ghost:
        btn = TextButton(
          onPressed: disabled ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.navy,
            minimumSize: Size(_isIcon ? _height : 0, _height),
            fixedSize: _isIcon ? Size(_height, _height) : null,
            padding: _padding,
            textStyle: TextStyle(
              fontFamily: 'AtkinsonHyperlegible',
              fontSize: _fontSize,
              fontWeight: FontWeight.w700,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: child,
        );
      case AppButtonVariant.destructive:
        btn = FilledButton(
          onPressed: disabled ? null : onPressed,
          style: _baseStyle(
            bg: AppColors.destructive,
            fg: AppColors.destructiveFg,
          ),
          child: child,
        );
    }

    if (expand && !_isIcon) {
      return SizedBox(width: double.infinity, child: btn);
    }
    return btn;
  }

  ButtonStyle _baseStyle({required Color bg, required Color fg}) {
    return FilledButton.styleFrom(
      backgroundColor: bg,
      foregroundColor: fg,
      disabledBackgroundColor: bg.withValues(alpha: 0.4),
      disabledForegroundColor: fg.withValues(alpha: 0.7),
      minimumSize: Size(_isIcon ? _height : 0, _height),
      fixedSize: _isIcon ? Size(_height, _height) : null,
      padding: _padding,
      elevation: 0,
      textStyle: TextStyle(
        fontFamily: 'AtkinsonHyperlegible',
        fontSize: _fontSize,
        fontWeight: FontWeight.w700,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }

  Widget _buildChild() {
    if (isLoading) {
      return SizedBox(
        height: 18,
        width: 18,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(_loadingColor()),
        ),
      );
    }
    if (_isIcon) {
      return Icon(leadingIcon, size: size == AppButtonSize.iconLg ? 24 : 20);
    }
    final hasLeading = leadingIcon != null;
    final hasTrailing = trailingIcon != null;
    if (!hasLeading && !hasTrailing) {
      return Text(label);
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (hasLeading) ...[
          Icon(leadingIcon, size: 18),
          const SizedBox(width: 8),
        ],
        Flexible(child: Text(label)),
        if (hasTrailing) ...[
          const SizedBox(width: 8),
          Icon(trailingIcon, size: 18),
        ],
      ],
    );
  }

  Color _loadingColor() {
    switch (variant) {
      case AppButtonVariant.primary:
        return AppColors.cream;
      case AppButtonVariant.accent:
        return AppColors.accentFg;
      case AppButtonVariant.secondary:
        return AppColors.navy;
      case AppButtonVariant.outline:
      case AppButtonVariant.ghost:
        return AppColors.navy;
      case AppButtonVariant.destructive:
        return AppColors.destructiveFg;
    }
  }
}
