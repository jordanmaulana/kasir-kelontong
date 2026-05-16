import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sales_api.dart';
import '../domain/sale.dart';

final salesTodayProvider = FutureProvider.autoDispose<List<Sale>>((ref) async {
  return ref.watch(salesApiProvider).today();
});
