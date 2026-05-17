import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/product.dart';

class ProductsApi {
  ProductsApi(this._dio);
  final Dio _dio;

  Future<List<Product>> list({String? query}) async {
    try {
      final res = await _dio.get<List<dynamic>>(
        '/products/',
        queryParameters: <String, dynamic>{
          if (query != null && query.isNotEmpty) 'q': query,
        },
      );
      return (res.data ?? <dynamic>[])
          .cast<Map<String, dynamic>>()
          .map(Product.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Product> create(Map<String, dynamic> payload) async {
    try {
      final res =
          await _dio.post<Map<String, dynamic>>('/products/', data: payload);
      return Product.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Product> update(String id, Map<String, dynamic> patch) async {
    try {
      final res =
          await _dio.patch<Map<String, dynamic>>('/products/$id/', data: patch);
      return Product.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _dio.delete<void>('/products/$id/');
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<String?> lookupBarcode(
    String barcode, {
    CancelToken? cancelToken,
  }) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/barcode-lookup/',
        queryParameters: <String, dynamic>{'barcode': barcode},
        cancelToken: cancelToken,
      );
      return res.data?['name'] as String?;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 404 || status == 400) return null;
      throw ApiError.fromDio(e);
    }
  }
}

final productsApiProvider = Provider<ProductsApi>((ref) {
  return ProductsApi(ref.watch(adminDioProvider));
});
