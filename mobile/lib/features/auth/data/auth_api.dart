import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/user.dart';

class AuthApi {
  AuthApi({required Dio adminDio, required Dio publicDio})
      : _admin = adminDio,
        _public = publicDio;

  final Dio _admin;
  final Dio _public;

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _public.post<Map<String, dynamic>>(
        '/auth/login/',
        data: <String, dynamic>{'email': email, 'password': password},
      );
      return _parseAuth(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<AuthResult> register({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _public.post<Map<String, dynamic>>(
        '/auth/register/',
        data: <String, dynamic>{'email': email, 'password': password},
      );
      return _parseAuth(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<AuthResult> google({required String credential}) async {
    try {
      final res = await _public.post<Map<String, dynamic>>(
        '/auth/google/',
        data: <String, dynamic>{'credential': credential},
      );
      return _parseAuth(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<AppUser> me() async {
    try {
      final res = await _admin.get<Map<String, dynamic>>('/auth/me/');
      return AppUser.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<AppUser> onboarding({
    required String name,
    required String code,
    required String address,
  }) async {
    try {
      final res = await _admin.post<Map<String, dynamic>>(
        '/auth/onboarding/',
        data: <String, dynamic>{'name': name, 'code': code, 'address': address},
      );
      final data = res.data!;
      return AppUser.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<void> logout() async {
    try {
      await _admin.post<void>('/auth/logout/');
    } on DioException catch (_) {
      // even if server fails, client should clear tokens
    }
  }

  AuthResult _parseAuth(Map<String, dynamic> data) {
    return AuthResult(
      token: data['token'] as String,
      user: AppUser.fromJson(data['user'] as Map<String, dynamic>),
    );
  }
}

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(
    adminDio: ref.watch(adminDioProvider),
    publicDio: ref.watch(publicDioProvider),
  );
});
