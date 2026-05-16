class Store {
  const Store({
    required this.id,
    required this.name,
    required this.code,
    this.address,
  });

  final String id;
  final String name;
  final String code;
  final String? address;

  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      address: json['address'] as String?,
    );
  }
}
