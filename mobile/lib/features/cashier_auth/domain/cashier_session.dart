class CashierIdentity {
  const CashierIdentity({
    required this.id,
    required this.displayName,
  });

  final String id;
  final String displayName;

  factory CashierIdentity.fromJson(Map<String, dynamic> json) {
    return CashierIdentity(
      id: json['id'].toString(),
      displayName: json['display_name'] as String? ?? '',
    );
  }
}

class StoreRef {
  const StoreRef({required this.id, required this.name, required this.code});

  final String id;
  final String name;
  final String code;

  factory StoreRef.fromJson(Map<String, dynamic> json) {
    return StoreRef(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
    );
  }
}

class CashierSession {
  const CashierSession({
    required this.token,
    required this.expiresAt,
    required this.cashier,
    required this.store,
  });

  final String token;
  final DateTime expiresAt;
  final CashierIdentity cashier;
  final StoreRef store;

  factory CashierSession.fromJson(Map<String, dynamic> json) {
    return CashierSession(
      token: json['token'] as String,
      expiresAt: DateTime.parse(json['expires_at'] as String),
      cashier:
          CashierIdentity.fromJson(json['cashier'] as Map<String, dynamic>),
      store: StoreRef.fromJson(json['store'] as Map<String, dynamic>),
    );
  }
}
