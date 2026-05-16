import 'package:dio/dio.dart';

import '../storage/secure_token_store.dart';

class CashierAuthInterceptor extends Interceptor {
  CashierAuthInterceptor(this._store);

  final SecureTokenStore _store;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _store.readCashierToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'CashierToken $token';
    }
    handler.next(options);
  }
}
