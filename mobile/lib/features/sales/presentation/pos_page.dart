import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../cashier_auth/application/cashier_session_controller.dart';
import 'pos_cart_panel.dart';
import 'pos_search_panel.dart';

class PosPage extends ConsumerStatefulWidget {
  const PosPage({super.key});

  @override
  ConsumerState<PosPage> createState() => _PosPageState();
}

class _PosPageState extends ConsumerState<PosPage> {
  bool _oriented = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_oriented) return;
    _oriented = true;
    final isTablet = MediaQuery.of(context).size.shortestSide >= 600;
    SystemChrome.setPreferredOrientations(
      isTablet
          ? <DeviceOrientation>[
              DeviceOrientation.landscapeLeft,
              DeviceOrientation.landscapeRight,
            ]
          : <DeviceOrientation>[DeviceOrientation.portraitUp],
    );
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(cashierSessionProvider).session;
    final size = MediaQuery.sizeOf(context);
    final wide = size.width >= 900;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/cashier/home'),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('POS'),
            if (session != null) ...[
              const SizedBox(width: 10),
              AppBadge(
                label: session.store.code,
                variant: AppBadgeVariant.secondary,
              ),
            ],
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Penjualan hari ini',
            icon: const Icon(Icons.receipt_long),
            onPressed: () => context.go('/cashier/pos/sales'),
          ),
        ],
      ),
      backgroundColor: AppColors.cream,
      body: SafeArea(
        child: wide
            ? const Row(
                children: [
                  Expanded(child: PosSearchPanel()),
                  SizedBox(
                    width: 420,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        border: Border(
                          left: BorderSide(color: AppColors.border),
                        ),
                      ),
                      child: PosCartPanel(),
                    ),
                  ),
                ],
              )
            : const Column(
                children: [
                  Expanded(child: PosSearchPanel()),
                  SizedBox(
                    height: 360,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppColors.border),
                        ),
                      ),
                      child: PosCartPanel(),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
