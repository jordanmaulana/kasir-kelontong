import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/store.dart';

class StoresApi {
  StoresApi(this._dio);
  final Dio _dio;

  Future<List<Store>> list() async {
    try {
      final res = await _dio.get<List<dynamic>>('/stores/');
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(Store.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Store> get(String id) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/stores/$id/');
      return Store.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Store> create({
    required String name,
    required String code,
    String? address,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/stores/',
        data: <String, dynamic>{
          'name': name,
          'code': code,
          if (address != null) 'address': address,
        },
      );
      return Store.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Store> update(String id, Map<String, dynamic> patch) async {
    try {
      final res =
          await _dio.patch<Map<String, dynamic>>('/stores/$id/', data: patch);
      return Store.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _dio.delete<void>('/stores/$id/');
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }
}

final storesApiProvider = Provider<StoresApi>((ref) {
  return StoresApi(ref.watch(adminDioProvider));
});
