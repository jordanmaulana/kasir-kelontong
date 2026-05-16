import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/sale.dart';

class SaleLineInput {
  const SaleLineInput({
    required this.productId,
    required this.qty,
    this.isBundle = false,
  });
  final String productId;
  final num qty;
  final bool isBundle;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'product_id': productId,
        'qty': qty,
        if (isBundle) 'is_bundle': true,
      };
}

class SalesApi {
  SalesApi(this._dio);
  final Dio _dio;

  Future<Sale> create({
    required List<SaleLineInput> lines,
    required int tendered,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/cashier/sales/',
        data: <String, dynamic>{
          'lines': lines.map((l) => l.toJson()).toList(),
          'tendered': tendered,
        },
      );
      return Sale.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<List<Sale>> today() async {
    try {
      final res = await _dio.get<List<dynamic>>('/cashier/sales/today/');
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(Sale.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }
}

final salesApiProvider = Provider<SalesApi>((ref) {
  return SalesApi(ref.watch(cashierDioProvider));
});
