import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../app/env.dart';
import '../storage/secure_token_store.dart';
import 'admin_interceptor.dart';
import 'cashier_interceptor.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

final tokenStoreProvider = Provider<SecureTokenStore>((ref) {
  return SecureTokenStore(ref.watch(secureStorageProvider));
});

Dio _baseDio() {
  return Dio(
    BaseOptions(
      baseUrl: Env.apiBase,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      contentType: 'application/json',
      headers: <String, String>{'Accept': 'application/json'},
      responseType: ResponseType.json,
    ),
  );
}

final adminDioProvider = Provider<Dio>((ref) {
  final dio = _baseDio();
  dio.interceptors.add(AdminAuthInterceptor(ref.watch(tokenStoreProvider)));
  return dio;
});

final cashierDioProvider = Provider<Dio>((ref) {
  final dio = _baseDio();
  dio.interceptors.add(CashierAuthInterceptor(ref.watch(tokenStoreProvider)));
  return dio;
});

final publicDioProvider = Provider<Dio>((ref) => _baseDio());
