import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStore {
  SecureTokenStore(this._storage);

  static const _adminTokenKey = 'admin_token';
  static const _cashierTokenKey = 'cashier_token';

  final FlutterSecureStorage _storage;

  Future<String?> readAdminToken() => _storage.read(key: _adminTokenKey);
  Future<void> writeAdminToken(String value) =>
      _storage.write(key: _adminTokenKey, value: value);
  Future<void> clearAdminToken() => _storage.delete(key: _adminTokenKey);

  Future<String?> readCashierToken() => _storage.read(key: _cashierTokenKey);
  Future<void> writeCashierToken(String value) =>
      _storage.write(key: _cashierTokenKey, value: value);
  Future<void> clearCashierToken() => _storage.delete(key: _cashierTokenKey);
}
