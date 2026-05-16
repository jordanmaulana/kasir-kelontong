class Env {
  const Env._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static String get apiBase => '$apiUrl/api/v1';
}
