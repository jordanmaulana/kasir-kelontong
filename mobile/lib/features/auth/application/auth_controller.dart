import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/storage/secure_token_store.dart';
import '../../../core/api/dio_client.dart';
import '../data/auth_api.dart';
import '../domain/user.dart';

class AuthState {
  const AuthState({this.user, this.loading = false, this.error});

  final AppUser? user;
  final bool loading;
  final Object? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AppUser? user,
    bool? loading,
    Object? error,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

class AuthController extends Notifier<AuthState> {
  late final AuthApi _api;
  late final SecureTokenStore _store;

  @override
  AuthState build() {
    _api = ref.watch(authApiProvider);
    _store = ref.watch(tokenStoreProvider);
    return const AuthState(loading: true);
  }

  Future<void> bootstrap() async {
    final token = await _store.readAdminToken();
    if (token == null || token.isEmpty) {
      state = const AuthState();
      return;
    }
    try {
      final user = await _api.me();
      state = AuthState(user: user);
    } on ApiError {
      await _store.clearAdminToken();
      state = const AuthState();
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final res = await _api.login(email: email, password: password);
      await _store.writeAdminToken(res.token);
      state = AuthState(user: res.user);
    } catch (e) {
      state = state.copyWith(loading: false, error: e);
      rethrow;
    }
  }

  Future<void> register(String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final res = await _api.register(email: email, password: password);
      await _store.writeAdminToken(res.token);
      state = AuthState(user: res.user);
    } catch (e) {
      state = state.copyWith(loading: false, error: e);
      rethrow;
    }
  }

  Future<void> google(String credential) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final res = await _api.google(credential: credential);
      await _store.writeAdminToken(res.token);
      state = AuthState(user: res.user);
    } catch (e) {
      state = state.copyWith(loading: false, error: e);
      rethrow;
    }
  }

  Future<void> completeOnboarding({
    required String name,
    required String code,
    required String address,
  }) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final user =
          await _api.onboarding(name: name, code: code, address: address);
      state = AuthState(user: user);
    } catch (e) {
      state = state.copyWith(loading: false, error: e);
      rethrow;
    }
  }

  Future<void> logout() async {
    await _api.logout();
    await _store.clearAdminToken();
    state = const AuthState();
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
