import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/products_api.dart';
import '../domain/product.dart';

final productsQueryProvider = StateProvider<String>((ref) => '');

final productsListProvider =
    FutureProvider.autoDispose<List<Product>>((ref) async {
  final q = ref.watch(productsQueryProvider);
  return ref.watch(productsApiProvider).list(query: q.trim());
});
