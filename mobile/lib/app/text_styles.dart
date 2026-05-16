import 'package:flutter/material.dart';

import 'colors.dart';

const _font = 'AtkinsonHyperlegible';

class AppTextStyles {
  const AppTextStyles._();

  static const TextStyle xs = TextStyle(
    fontFamily: _font,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.navy,
    height: 1.4,
  );
  static const TextStyle sm = TextStyle(
    fontFamily: _font,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.navy,
    height: 1.45,
  );
  static const TextStyle base = TextStyle(
    fontFamily: _font,
    fontSize: 18,
    fontWeight: FontWeight.w400,
    color: AppColors.navy,
    height: 1.5,
  );
  static const TextStyle lg = TextStyle(
    fontFamily: _font,
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    height: 1.35,
  );
  static const TextStyle xl = TextStyle(
    fontFamily: _font,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    height: 1.25,
  );
  static const TextStyle xxl = TextStyle(
    fontFamily: _font,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    height: 1.2,
  );
  static const TextStyle xxxl = TextStyle(
    fontFamily: _font,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    height: 1.1,
  );

  static const TextStyle eyebrow = TextStyle(
    fontFamily: _font,
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.mutedFg,
    letterSpacing: 1.6,
    height: 1.2,
  );
}

extension TabularTextStyle on TextStyle {
  TextStyle get tabular => copyWith(
        fontFeatures: const [FontFeature.tabularFigures()],
      );
}
