import 'package:flutter/material.dart';

import 'colors.dart';
import 'text_styles.dart';

class AppTheme {
  const AppTheme._();

  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.navy,
      onPrimary: AppColors.cream,
      primaryContainer: AppColors.navy,
      onPrimaryContainer: AppColors.cream,
      secondary: AppColors.secondary,
      onSecondary: AppColors.navy,
      secondaryContainer: AppColors.secondary,
      onSecondaryContainer: AppColors.navy,
      tertiary: AppColors.accent,
      onTertiary: AppColors.accentFg,
      tertiaryContainer: AppColors.accent,
      onTertiaryContainer: AppColors.accentFg,
      error: AppColors.destructive,
      onError: AppColors.destructiveFg,
      errorContainer: AppColors.destructive,
      onErrorContainer: AppColors.destructiveFg,
      surface: AppColors.surface,
      onSurface: AppColors.navy,
      surfaceContainerHighest: AppColors.muted,
      onSurfaceVariant: AppColors.mutedFg,
      outline: AppColors.border,
      outlineVariant: AppColors.border,
      shadow: Color(0x1A0F2A3F),
      scrim: Color(0x800F2A3F),
      inverseSurface: AppColors.navy,
      onInverseSurface: AppColors.cream,
      inversePrimary: AppColors.accent,
    );

    final textTheme = const TextTheme(
      displayLarge: AppTextStyles.xxxl,
      displayMedium: AppTextStyles.xxl,
      displaySmall: AppTextStyles.xl,
      headlineLarge: AppTextStyles.xxl,
      headlineMedium: AppTextStyles.xl,
      headlineSmall: AppTextStyles.lg,
      titleLarge: AppTextStyles.lg,
      titleMedium: TextStyle(
        fontFamily: 'AtkinsonHyperlegible',
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: AppColors.navy,
        height: 1.4,
      ),
      titleSmall: TextStyle(
        fontFamily: 'AtkinsonHyperlegible',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.navy,
        height: 1.4,
      ),
      bodyLarge: AppTextStyles.base,
      bodyMedium: AppTextStyles.sm,
      bodySmall: AppTextStyles.xs,
      labelLarge: TextStyle(
        fontFamily: 'AtkinsonHyperlegible',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.navy,
        height: 1.2,
      ),
      labelMedium: TextStyle(
        fontFamily: 'AtkinsonHyperlegible',
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.navy,
        height: 1.2,
      ),
      labelSmall: AppTextStyles.eyebrow,
    );

    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      visualDensity: VisualDensity.comfortable,
      scaffoldBackgroundColor: AppColors.cream,
      canvasColor: AppColors.cream,
      fontFamily: 'AtkinsonHyperlegible',
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      iconTheme: const IconThemeData(color: AppColors.navy, size: 22),
      primaryIconTheme: const IconThemeData(color: AppColors.cream, size: 22),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.cream,
        foregroundColor: AppColors.navy,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.navy,
        ),
        iconTheme: IconThemeData(color: AppColors.navy, size: 24),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.navy,
          foregroundColor: AppColors.cream,
          minimumSize: const Size(0, 48),
          textStyle: const TextStyle(
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.navy,
          foregroundColor: AppColors.cream,
          elevation: 0,
          minimumSize: const Size(0, 48),
          textStyle: const TextStyle(
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.navy,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: AppColors.navy, width: 1.5),
          textStyle: const TextStyle(
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.navy,
          minimumSize: const Size(0, 44),
          textStyle: const TextStyle(
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        hintStyle: const TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          color: AppColors.mutedFg,
        ),
        labelStyle: const TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          color: AppColors.navy,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.ring, width: 3),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.destructive),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.destructive, width: 3),
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: AppColors.navy,
        unselectedLabelColor: AppColors.mutedFg,
        labelStyle: TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          fontWeight: FontWeight.w400,
        ),
        indicator: UnderlineTabIndicator(
          borderSide: BorderSide(color: AppColors.accent, width: 3),
        ),
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: AppColors.border,
        dividerHeight: 1,
        overlayColor: WidgetStatePropertyAll(Color(0x140F2A3F)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        titleTextStyle: const TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: AppColors.navy,
        ),
        contentTextStyle: const TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          color: AppColors.navy,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 4,
        modalElevation: 4,
        showDragHandle: true,
        dragHandleColor: AppColors.border,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
        ),
      ),
      chipTheme: const ChipThemeData(
        backgroundColor: AppColors.cream,
        selectedColor: AppColors.accent,
        side: BorderSide(color: AppColors.border),
        labelStyle: TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.navy,
        ),
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        shape: StadiumBorder(),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        space: 1,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.navy,
        contentTextStyle: const TextStyle(
          fontFamily: 'AtkinsonHyperlegible',
          fontSize: 16,
          color: AppColors.cream,
        ),
        actionTextColor: AppColors.accent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.navy,
        linearTrackColor: AppColors.muted,
        circularTrackColor: AppColors.muted,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.accentFg,
        elevation: 0,
        focusElevation: 0,
        hoverElevation: 0,
        highlightElevation: 0,
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: AppColors.navy,
        textColor: AppColors.navy,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
      checkboxTheme: CheckboxThemeData(
        side: const BorderSide(color: AppColors.border, width: 1.5),
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.navy
              : AppColors.surface,
        ),
        checkColor: const WidgetStatePropertyAll(AppColors.cream),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.navy
              : AppColors.border,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.cream
              : AppColors.surface,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.navy
              : AppColors.border,
        ),
      ),
    );
  }
}
