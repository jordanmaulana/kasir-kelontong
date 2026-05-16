import 'package:dio/dio.dart';

import '../storage/secure_token_store.dart';

class AdminAuthInterceptor extends Interceptor {
  AdminAuthInterceptor(this._store);

  final SecureTokenStore _store;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _store.readAdminToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Token $token';
    }
    handler.next(options);
  }
}
