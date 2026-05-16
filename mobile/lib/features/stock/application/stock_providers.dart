import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/hive_boxes.dart';
import '../data/stock_api.dart';
import '../domain/stock_movement.dart';
import '../domain/stock_row.dart';

final stockQueryProvider = StateProvider<String>((ref) => '');

final adminStockProvider = FutureProvider.autoDispose
    .family<List<StockRow>, String>((ref, storeId) async {
  final q = ref.watch(stockQueryProvider);
  return ref.watch(stockApiProvider).adminStock(storeId, query: q.trim());
});

final movementsProvider = FutureProvider.autoDispose
    .family<List<StockMovement>, String>((ref, storeId) async {
  return ref.watch(stockApiProvider).movements(storeId);
});

/// Cashier stock list with Hive cache. Refreshes from network and persists
/// every successful result into `stock_cache` Hive box keyed by storeId/productId.
final cashierStockProvider =
    FutureProvider.autoDispose<List<StockRow>>((ref) async {
  final rows = await ref.watch(stockApiProvider).cashierStock();
  final box = HiveBoxes.stockBox();
  for (final row in rows) {
    await box.put(row.product.id, row.toCacheJson());
  }
  return rows;
});
