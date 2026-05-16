import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/stores_api.dart';
import '../domain/store.dart';

final storesListProvider = FutureProvider.autoDispose<List<Store>>((ref) async {
  return ref.watch(storesApiProvider).list();
});

final storeByIdProvider =
    FutureProvider.autoDispose.family<Store, String>((ref, id) async {
  return ref.watch(storesApiProvider).get(id);
});
