import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/colors.dart';
import 'app_drawer.dart';
import 'page_title.dart';

class _BrandTitle extends StatelessWidget {
  const _BrandTitle({this.tagline});

  final String? tagline;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.navy,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.store, color: AppColors.cream, size: 18),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'KasirKelontong',
              style: TextStyle(
                fontFamily: 'AtkinsonHyperlegible',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.navy,
                height: 1.1,
              ),
            ),
            if (tagline != null)
              Text(
                tagline!,
                style: const TextStyle(
                  fontFamily: 'AtkinsonHyperlegible',
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  color: AppColors.mutedFg,
                  height: 1.1,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.child,
    this.eyebrow,
    this.title,
    this.subtitle,
    this.action,
    this.appBarActions,
    this.bottom,
    this.scrollable = true,
    this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 24),
    this.floatingActionButton,
  });

  final Widget child;
  final String? eyebrow;
  final String? title;
  final String? subtitle;
  final Widget? action;
  final List<Widget>? appBarActions;
  final PreferredSizeWidget? bottom;
  final bool scrollable;
  final EdgeInsets padding;
  final Widget? floatingActionButton;

  bool get _hasTitle => title != null;

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).matchedLocation;
    return Scaffold(
      appBar: AppBar(
        title: const _BrandTitle(),
        actions: appBarActions,
        bottom: bottom,
      ),
      drawer: AppDrawer(currentPath: currentPath),
      floatingActionButton: floatingActionButton,
      body: SafeArea(
        child: scrollable
            ? SingleChildScrollView(
                padding: padding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_hasTitle) ...[
                      PageTitle(
                        eyebrow: eyebrow,
                        title: title!,
                        subtitle: subtitle,
                        action: action,
                      ),
                      const SizedBox(height: 24),
                    ],
                    child,
                  ],
                ),
              )
            : Padding(
                padding: padding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_hasTitle) ...[
                      PageTitle(
                        eyebrow: eyebrow,
                        title: title!,
                        subtitle: subtitle,
                        action: action,
                      ),
                      const SizedBox(height: 24),
                    ],
                    Expanded(child: child),
                  ],
                ),
              ),
      ),
    );
  }
}

class CashierShell extends StatelessWidget {
  const CashierShell({
    super.key,
    required this.child,
    this.eyebrow,
    this.title,
    this.subtitle,
    this.action,
    this.appBarActions,
    this.bottom,
    this.scrollable = true,
    this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 24),
    this.floatingActionButton,
  });

  final Widget child;
  final String? eyebrow;
  final String? title;
  final String? subtitle;
  final Widget? action;
  final List<Widget>? appBarActions;
  final PreferredSizeWidget? bottom;
  final bool scrollable;
  final EdgeInsets padding;
  final Widget? floatingActionButton;

  bool get _hasTitle => title != null;

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).matchedLocation;
    final body = Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_hasTitle) ...[
            PageTitle(
              eyebrow: eyebrow,
              title: title!,
              subtitle: subtitle,
              action: action,
            ),
            const SizedBox(height: 24),
          ],
          if (scrollable) Flexible(child: child) else child,
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const _BrandTitle(tagline: 'KASIR'),
        actions: appBarActions,
        bottom: bottom,
      ),
      drawer: CashierDrawer(currentPath: currentPath),
      floatingActionButton: floatingActionButton,
      body: SafeArea(
        child: scrollable
            ? SingleChildScrollView(
                child: body,
              )
            : body,
      ),
    );
  }
}
