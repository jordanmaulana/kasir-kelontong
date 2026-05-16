enum StockReason { receiving, sale, adjustment, voidSale, unknown }

StockReason _parseReason(String? raw) {
  switch (raw) {
    case 'RECEIVING':
    case 'receiving':
      return StockReason.receiving;
    case 'SALE':
    case 'sale':
      return StockReason.sale;
    case 'ADJUSTMENT':
    case 'adjustment':
      return StockReason.adjustment;
    case 'VOID':
    case 'void':
      return StockReason.voidSale;
    default:
      return StockReason.unknown;
  }
}

String reasonLabel(StockReason reason) {
  switch (reason) {
    case StockReason.receiving:
      return 'Kulakan';
    case StockReason.sale:
      return 'Penjualan';
    case StockReason.adjustment:
      return 'Penyesuaian';
    case StockReason.voidSale:
      return 'Pembatalan';
    case StockReason.unknown:
      return '—';
  }
}

class StockMovement {
  const StockMovement({
    required this.id,
    required this.productId,
    required this.productName,
    required this.delta,
    required this.reason,
    required this.createdOn,
    this.actorEmail,
    this.note,
  });

  final String id;
  final String productId;
  final String productName;
  final num delta;
  final StockReason reason;
  final DateTime createdOn;
  final String? actorEmail;
  final String? note;

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    return StockMovement(
      id: json['id'].toString(),
      productId: json['product_id']?.toString() ?? '',
      productName: json['product_name'] as String? ?? '',
      delta: (json['delta'] as num?) ?? 0,
      reason: _parseReason(json['reason'] as String?),
      createdOn: DateTime.parse(json['created_on'] as String),
      actorEmail: json['actor_email'] as String?,
      note: json['note'] as String?,
    );
  }
}
