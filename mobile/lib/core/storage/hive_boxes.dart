import 'package:hive_flutter/hive_flutter.dart';

class HiveBoxes {
  const HiveBoxes._();

  static const String stockCache = 'stock_cache';
  static const String session = 'session';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Future.wait(<Future<void>>[
      Hive.openBox<Map<dynamic, dynamic>>(stockCache),
      Hive.openBox<dynamic>(session),
    ]);
  }

  static Box<Map<dynamic, dynamic>> stockBox() =>
      Hive.box<Map<dynamic, dynamic>>(stockCache);
  static Box<dynamic> sessionBox() => Hive.box<dynamic>(session);
}
