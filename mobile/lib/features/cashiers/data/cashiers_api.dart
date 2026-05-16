import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../../cashier_auth/domain/cashier_session.dart';
import '../domain/cashier.dart';

class CashiersApi {
  CashiersApi(this._dio);
  final Dio _dio;

  Future<List<Cashier>> list(String storeId) async {
    try {
      final res = await _dio.get<List<dynamic>>('/stores/$storeId/cashiers/');
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(Cashier.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Cashier> create(
    String storeId, {
    required String displayName,
    required String pin,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/stores/$storeId/cashiers/',
        data: <String, dynamic>{'display_name': displayName, 'pin': pin},
      );
      return Cashier.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Cashier> update(
    String storeId,
    String id,
    Map<String, dynamic> patch,
  ) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/stores/$storeId/cashiers/$id/',
        data: patch,
      );
      return Cashier.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<void> delete(String storeId, String id) async {
    try {
      await _dio.delete<void>('/stores/$storeId/cashiers/$id/');
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<CashierSession> impersonate(String storeId, String id) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/stores/$storeId/cashiers/$id/impersonate/',
      );
      return CashierSession.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }
}

final cashiersApiProvider = Provider<CashiersApi>((ref) {
  return CashiersApi(ref.watch(adminDioProvider));
});
