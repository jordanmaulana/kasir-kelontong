import '../../products/domain/product.dart';

class StockRow {
  const StockRow({
    required this.product,
    required this.qty,
    this.lastMovementAt,
  });

  final Product product;
  final num qty;
  final DateTime? lastMovementAt;

  factory StockRow.fromJson(Map<String, dynamic> json) {
    final productJson =
        json['product'] is Map ? json['product'] as Map<String, dynamic> : json;
    return StockRow(
      product: Product.fromJson(productJson),
      qty: (json['qty'] as num?) ?? 0,
      lastMovementAt: json['last_movement_at'] != null
          ? DateTime.tryParse(json['last_movement_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toCacheJson() => <String, dynamic>{
        'product': <String, dynamic>{
          'id': product.id,
          'name': product.name,
          'barcode': product.barcode,
          'sell_price': product.sellPrice,
          'bundle_qty': product.bundleQty,
          'bundle_price': product.bundlePrice,
          'bundle_label': product.bundleLabel,
          'is_weighted': product.isWeighted,
          'unit_label': product.unitLabel,
        },
        'qty': qty,
        'last_movement_at': lastMovementAt?.toIso8601String(),
      };
}
