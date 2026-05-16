class ReportSummary {
  const ReportSummary({
    required this.count,
    required this.grossRevenue,
    required this.itemsSold,
  });
  final int count;
  final int grossRevenue;
  final num itemsSold;

  factory ReportSummary.fromJson(Map<String, dynamic> json) {
    return ReportSummary(
      count: (json['count'] as num?)?.toInt() ?? 0,
      grossRevenue: (json['gross_revenue'] as num?)?.toInt() ?? 0,
      itemsSold: (json['items_sold'] as num?) ?? 0,
    );
  }
}

class TopProduct {
  const TopProduct({
    required this.productId,
    required this.productName,
    required this.qtySold,
    required this.revenue,
  });
  final String productId;
  final String productName;
  final num qtySold;
  final int revenue;

  factory TopProduct.fromJson(Map<String, dynamic> json) {
    return TopProduct(
      productId: json['product_id'].toString(),
      productName: json['product_name'] as String? ?? '',
      qtySold: (json['qty_sold'] as num?) ?? 0,
      revenue: (json['revenue'] as num?)?.toInt() ?? 0,
    );
  }
}

class SalesReport {
  const SalesReport({
    required this.from,
    required this.to,
    required this.summary,
    required this.topProducts,
  });
  final DateTime from;
  final DateTime to;
  final ReportSummary summary;
  final List<TopProduct> topProducts;

  factory SalesReport.fromJson(Map<String, dynamic> json) {
    return SalesReport(
      from: DateTime.parse(json['from'] as String),
      to: DateTime.parse(json['to'] as String),
      summary: ReportSummary.fromJson(json['summary'] as Map<String, dynamic>),
      topProducts: (json['top_products'] as List<dynamic>? ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(TopProduct.fromJson)
          .toList(),
    );
  }
}
