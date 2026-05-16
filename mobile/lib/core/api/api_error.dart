import 'package:dio/dio.dart';

class ApiError implements Exception {
  ApiError({required this.status, required this.detail});

  final int status;
  final String detail;

  @override
  String toString() => 'ApiError($status): $detail';

  static ApiError fromDio(DioException e) {
    final response = e.response;
    if (response == null) {
      return ApiError(status: 0, detail: 'Tidak ada koneksi ke server');
    }
    final data = response.data;
    String detail;
    if (data is Map && data['detail'] is String) {
      detail = data['detail'] as String;
    } else if (data is Map && data.isNotEmpty) {
      detail = data.values.first.toString();
    } else if (data is String && data.isNotEmpty) {
      detail = data;
    } else {
      detail = 'Terjadi kesalahan (${response.statusCode})';
    }
    return ApiError(status: response.statusCode ?? 0, detail: detail);
  }
}
