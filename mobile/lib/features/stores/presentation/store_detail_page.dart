import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../cashiers/presentation/cashiers_tab.dart';
import '../../reports/presentation/reports_tab.dart';
import '../../stock/presentation/movements_tab.dart';
import '../../stock/presentation/receiving_tab.dart';
import '../../stock/presentation/stock_tab.dart';
import '../application/stores_providers.dart';

class StoreDetailPage extends ConsumerWidget {
  const StoreDetailPage({super.key, required this.storeId});
  final String storeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final store = ref.watch(storeByIdProvider(storeId));
    final currentPath = GoRouterState.of(context).matchedLocation;
    return Scaffold(
      drawer: AppDrawer(currentPath: currentPath),
      body: SafeArea(
        child: store.when(
          loading: () => const LoadingView(),
          error: (e, _) => ErrorView(
            error: e,
            onRetry: () => ref.invalidate(storeByIdProvider(storeId)),
          ),
          data: (s) => DefaultTabController(
            length: 5,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                  child: Row(
                    children: [
                      Builder(
                        builder: (ctx) => IconButton(
                          icon: const Icon(Icons.menu),
                          onPressed: () => Scaffold.of(ctx).openDrawer(),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () => context.go('/dashboard'),
                        tooltip: 'Kembali',
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'TOKO',
                              style: Theme.of(context).textTheme.labelSmall,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              s.name,
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                          ],
                        ),
                      ),
                      AppBadge(
                        label: s.code,
                        variant: AppBadgeVariant.secondary,
                      ),
                    ],
                  ),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: TabBar(
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    tabs: [
                      Tab(text: 'Kasir'),
                      Tab(text: 'Stok'),
                      Tab(text: 'Kulakan'),
                      Tab(text: 'Laporan'),
                      Tab(text: 'Riwayat'),
                    ],
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      CashiersTab(storeId: storeId),
                      StockTab(storeId: storeId),
                      ReceivingTab(storeId: storeId),
                      ReportsTab(storeId: storeId),
                      MovementsTab(storeId: storeId),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
