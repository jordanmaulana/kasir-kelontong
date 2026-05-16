import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/cashiers_api.dart';
import '../domain/cashier.dart';

final cashiersListProvider = FutureProvider.autoDispose
    .family<List<Cashier>, String>((ref, storeId) async {
  return ref.watch(cashiersApiProvider).list(storeId);
});
