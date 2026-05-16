import 'package:intl/intl.dart';

final NumberFormat _idr = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

final NumberFormat _qtyFmt = NumberFormat.decimalPattern('id_ID')
  ..maximumFractionDigits = 2
  ..minimumFractionDigits = 0;

String formatIdr(num value) => _idr.format(value);

String formatQty(num value) => _qtyFmt.format(value);

int? parseIdrInput(String raw) {
  final cleaned = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (cleaned.isEmpty) return null;
  return int.tryParse(cleaned);
}

const List<int> idrDenominations = <int>[
  500,
  1000,
  2000,
  5000,
  10000,
  20000,
  50000,
  100000,
];
