class SaleLine {
  const SaleLine({
    required this.id,
    required this.productId,
    required this.productName,
    required this.qty,
    required this.unitPrice,
    required this.lineTotal,
    this.barcode,
    this.isBundle = false,
    this.bundleQty,
    this.bundleLabel,
    this.isWeighted = false,
    this.unitLabel,
  });

  final String id;
  final String productId;
  final String productName;
  final num qty;
  final int unitPrice;
  final int lineTotal;
  final String? barcode;
  final bool isBundle;
  final int? bundleQty;
  final String? bundleLabel;
  final bool isWeighted;
  final String? unitLabel;

  factory SaleLine.fromJson(Map<String, dynamic> json) {
    return SaleLine(
      id: json['id'].toString(),
      productId: json['product_id'].toString(),
      productName: json['product_name'] as String? ?? '',
      qty: (json['qty'] as num?) ?? 0,
      unitPrice: (json['unit_price'] as num?)?.toInt() ?? 0,
      lineTotal: (json['line_total'] as num?)?.toInt() ?? 0,
      barcode: json['barcode'] as String?,
      isBundle: json['is_bundle'] as bool? ?? false,
      bundleQty: (json['bundle_qty'] as num?)?.toInt(),
      bundleLabel: json['bundle_label'] as String?,
      isWeighted: json['is_weighted'] as bool? ?? false,
      unitLabel: json['unit_label'] as String?,
    );
  }
}

class Sale {
  const Sale({
    required this.id,
    required this.subtotal,
    required this.tendered,
    required this.change,
    required this.createdOn,
    required this.lines,
    this.cashierName,
  });

  final String id;
  final int subtotal;
  final int tendered;
  final int change;
  final DateTime createdOn;
  final List<SaleLine> lines;
  final String? cashierName;

  factory Sale.fromJson(Map<String, dynamic> json) {
    return Sale(
      id: json['id'].toString(),
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      tendered: (json['tendered'] as num?)?.toInt() ?? 0,
      change: (json['change'] as num?)?.toInt() ?? 0,
      createdOn: DateTime.parse(json['created_on'] as String),
      cashierName: json['cashier_name'] as String?,
      lines: (json['lines'] as List<dynamic>? ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(SaleLine.fromJson)
          .toList(),
    );
  }
}
