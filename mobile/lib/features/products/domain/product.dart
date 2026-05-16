class Product {
  const Product({
    required this.id,
    required this.name,
    required this.sellPrice,
    this.barcode,
    this.bundleQty,
    this.bundlePrice,
    this.bundleLabel,
    this.isWeighted = false,
    this.unitLabel,
  });

  final String id;
  final String name;
  final int sellPrice;
  final String? barcode;
  final int? bundleQty;
  final int? bundlePrice;
  final String? bundleLabel;
  final bool isWeighted;
  final String? unitLabel;

  bool get hasBundle => bundleQty != null && bundlePrice != null;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      sellPrice: (json['sell_price'] as num?)?.toInt() ?? 0,
      barcode: json['barcode'] as String?,
      bundleQty: (json['bundle_qty'] as num?)?.toInt(),
      bundlePrice: (json['bundle_price'] as num?)?.toInt(),
      bundleLabel: json['bundle_label'] as String?,
      isWeighted: json['is_weighted'] as bool? ?? false,
      unitLabel: json['unit_label'] as String?,
    );
  }

  Map<String, dynamic> toCreateJson({String? initialStoreId, num? initialQty}) {
    return <String, dynamic>{
      'name': name,
      'sell_price': sellPrice,
      if (barcode != null && barcode!.isNotEmpty) 'barcode': barcode,
      if (bundleQty != null) 'bundle_qty': bundleQty,
      if (bundlePrice != null) 'bundle_price': bundlePrice,
      if (bundleLabel != null && bundleLabel!.isNotEmpty)
        'bundle_label': bundleLabel,
      'is_weighted': isWeighted,
      if (unitLabel != null && unitLabel!.isNotEmpty) 'unit_label': unitLabel,
      if (initialStoreId != null) 'initial_store_id': initialStoreId,
      if (initialQty != null) 'initial_qty': initialQty,
    };
  }
}
