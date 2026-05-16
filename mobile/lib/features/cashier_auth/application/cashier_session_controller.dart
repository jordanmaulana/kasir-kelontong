import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/storage/secure_token_store.dart';
import '../data/cashier_auth_api.dart';
import '../domain/cashier_session.dart';

class CashierAuthState {
  const CashierAuthState({this.session, this.loading = false, this.error});

  final CashierSession? session;
  final bool loading;
  final Object? error;

  bool get isAuthenticated => session != null;
}

class CashierSessionController extends Notifier<CashierAuthState> {
  late final CashierAuthApi _api;
  late final SecureTokenStore _store;

  @override
  CashierAuthState build() {
    _api = ref.watch(cashierAuthApiProvider);
    _store = ref.watch(tokenStoreProvider);
    return const CashierAuthState(loading: true);
  }

  Future<void> bootstrap() async {
    final token = await _store.readCashierToken();
    if (token == null || token.isEmpty) {
      state = const CashierAuthState();
      return;
    }
    try {
      final session = await _api.me();
      state = CashierAuthState(session: session);
    } on ApiError {
      await _store.clearCashierToken();
      state = const CashierAuthState();
    }
  }

  Future<void> login(String storeCode, String pin) async {
    state = const CashierAuthState(loading: true);
    try {
      final session = await _api.login(storeCode: storeCode, pin: pin);
      await _store.writeCashierToken(session.token);
      state = CashierAuthState(session: session);
    } catch (e) {
      state = CashierAuthState(error: e);
      rethrow;
    }
  }

  /// Adopt a cashier token issued via admin impersonation.
  Future<void> adoptToken(CashierSession session) async {
    await _store.writeCashierToken(session.token);
    state = CashierAuthState(session: session);
  }

  Future<void> logout() async {
    await _api.logout();
    await _store.clearCashierToken();
    state = const CashierAuthState();
  }
}

final cashierSessionProvider =
    NotifierProvider<CashierSessionController, CashierAuthState>(
  CashierSessionController.new,
);
