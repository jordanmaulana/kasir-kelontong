import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../domain/report.dart';

class ReportsApi {
  ReportsApi(this._dio);
  final Dio _dio;

  Future<SalesReport> report(
    String storeId, {
    required DateTime from,
    required DateTime to,
  }) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/stores/$storeId/sales/report/',
        queryParameters: <String, dynamic>{
          'from': _date(from),
          'to': _date(to),
        },
      );
      return SalesReport.fromJson(res.data!);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<List<int>> exportCsv(
    String storeId, {
    required DateTime from,
    required DateTime to,
  }) async {
    try {
      final res = await _dio.get<List<int>>(
        '/stores/$storeId/sales/report/',
        queryParameters: <String, dynamic>{
          'from': _date(from),
          'to': _date(to),
          'export': 'csv',
        },
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data ?? <int>[];
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  String _date(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

final reportsApiProvider = Provider<ReportsApi>((ref) {
  return ReportsApi(ref.watch(adminDioProvider));
});
