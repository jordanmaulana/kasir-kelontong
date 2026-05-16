class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.onboarded,
    this.name,
  });

  final String id;
  final String email;
  final bool onboarded;
  final String? name;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      email: json['email'] as String? ?? '',
      onboarded: json['onboarded'] as bool? ?? false,
      name: json['name'] as String?,
    );
  }
}

class AuthResult {
  const AuthResult({required this.token, required this.user});
  final String token;
  final AppUser user;
}
