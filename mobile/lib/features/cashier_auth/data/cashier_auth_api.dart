import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/cashier_session.dart';

class CashierAuthApi {
  CashierAuthApi({required Dio cashierDio, required Dio publicDio})
      : _cashier = cashierDio,
        _public = publicDio;

  final Dio _cashier;
  final Dio _public;

  Future<CashierSession> login({
    required String storeCode,
    required String pin,
  }) async {
    try {
      final res = await _public.post<Map<String, dynamic>>(
        '/auth/cashier-login/',
        data: <String, dynamic>{'store_code': storeCode, 'pin': pin},
      );
      return CashierSession.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<CashierSession> me() async {
    try {
      final res = await _cashier.get<Map<String, dynamic>>('/auth/cashier-me/');
      return CashierSession.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<void> logout() async {
    try {
      await _cashier.post<void>('/auth/cashier-logout/');
    } on DioException catch (_) {}
  }
}

final cashierAuthApiProvider = Provider<CashierAuthApi>((ref) {
  return CashierAuthApi(
    cashierDio: ref.watch(cashierDioProvider),
    publicDio: ref.watch(publicDioProvider),
  );
});
