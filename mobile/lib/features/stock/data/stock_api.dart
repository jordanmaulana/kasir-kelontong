import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/stock_movement.dart';
import '../domain/stock_row.dart';

class StockApi {
  StockApi({required Dio adminDio, required Dio cashierDio})
      : _admin = adminDio,
        _cashier = cashierDio;

  final Dio _admin;
  final Dio _cashier;

  Future<List<StockRow>> adminStock(String storeId, {String? query}) async {
    try {
      final res = await _admin.get<List<dynamic>>(
        '/stores/$storeId/stock/',
        queryParameters: <String, dynamic>{
          if (query != null && query.isNotEmpty) 'q': query,
        },
      );
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(StockRow.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<List<StockRow>> cashierStock({String? query}) async {
    try {
      final res = await _cashier.get<List<dynamic>>(
        '/cashier/stock/',
        queryParameters: <String, dynamic>{
          if (query != null && query.isNotEmpty) 'q': query,
        },
      );
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(StockRow.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<List<StockMovement>> movements(
    String storeId, {
    String? productId,
    String? reason,
    int limit = 100,
  }) async {
    try {
      final res = await _admin.get<List<dynamic>>(
        '/stores/$storeId/stock/movements/',
        queryParameters: <String, dynamic>{
          if (productId != null) 'product': productId,
          if (reason != null) 'reason': reason,
          'limit': limit,
        },
      );
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(StockMovement.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<List<StockMovement>> receiving(
    String storeId,
    List<Map<String, dynamic>> items,
  ) async {
    try {
      final res = await _admin.post<List<dynamic>>(
        '/stores/$storeId/receiving/',
        data: <String, dynamic>{'items': items},
      );
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(StockMovement.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<StockMovement> adjust(
    String storeId, {
    required String productId,
    num? delta,
    num? targetQty,
    String? note,
  }) async {
    try {
      final res = await _admin.post<Map<String, dynamic>>(
        '/stores/$storeId/adjustments/',
        data: <String, dynamic>{
          'product_id': productId,
          if (delta != null) 'delta': delta,
          if (targetQty != null) 'target_qty': targetQty,
          if (note != null && note.isNotEmpty) 'note': note,
        },
      );
      return StockMovement.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }
}

final stockApiProvider = Provider<StockApi>((ref) {
  return StockApi(
    adminDio: ref.watch(adminDioProvider),
    cashierDio: ref.watch(cashierDioProvider),
  );
});
