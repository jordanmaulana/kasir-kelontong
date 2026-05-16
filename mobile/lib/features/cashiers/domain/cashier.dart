class Cashier {
  const Cashier({
    required this.id,
    required this.displayName,
    required this.active,
    this.lastLoginAt,
  });

  final String id;
  final String displayName;
  final bool active;
  final DateTime? lastLoginAt;

  factory Cashier.fromJson(Map<String, dynamic> json) {
    return Cashier(
      id: json['id'].toString(),
      displayName: json['display_name'] as String? ?? '',
      active: json['active'] as bool? ?? true,
      lastLoginAt: json['last_login_at'] != null
          ? DateTime.tryParse(json['last_login_at'] as String)
          : null,
    );
  }
}
