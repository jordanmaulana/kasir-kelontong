import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/reports_api.dart';
import '../domain/report.dart';

class ReportRange {
  const ReportRange({
    required this.storeId,
    required this.from,
    required this.to,
  });
  final String storeId;
  final DateTime from;
  final DateTime to;

  @override
  bool operator ==(Object other) =>
      other is ReportRange &&
      other.storeId == storeId &&
      other.from == from &&
      other.to == to;

  @override
  int get hashCode => Object.hash(storeId, from, to);
}

final reportProvider = FutureProvider.autoDispose
    .family<SalesReport, ReportRange>((ref, range) async {
  return ref.watch(reportsApiProvider).report(
        range.storeId,
        from: range.from,
        to: range.to,
      );
});
