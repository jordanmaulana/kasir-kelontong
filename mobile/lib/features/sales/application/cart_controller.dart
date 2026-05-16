import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../products/domain/product.dart';

class CartLine {
  CartLine({
    required this.product,
    required this.qty,
    required this.isBundle,
  });

  final Product product;
  num qty;
  bool isBundle;

  int get unitPrice =>
      isBundle ? (product.bundlePrice ?? product.sellPrice) : product.sellPrice;

  /// Quantity in *base units* — what the stock movement will be.
  num get stockUnits => isBundle ? qty * (product.bundleQty ?? 1) : qty;

  int get lineTotal => (unitPrice * qty).round();

  CartLine copyWith({num? qty, bool? isBundle}) => CartLine(
        product: product,
        qty: qty ?? this.qty,
        isBundle: isBundle ?? this.isBundle,
      );
}

class CartState {
  CartState({required this.lines});

  final List<CartLine> lines;

  int get subtotal => lines.fold<int>(0, (sum, l) => sum + l.lineTotal);

  bool get isEmpty => lines.isEmpty;
}

class CartController extends Notifier<CartState> {
  @override
  CartState build() => CartState(lines: <CartLine>[]);

  void addProduct(Product product, {bool asBundle = false}) {
    final existing = state.lines.indexWhere(
      (l) => l.product.id == product.id && l.isBundle == asBundle,
    );
    final updated = <CartLine>[...state.lines];
    if (existing >= 0) {
      final line = updated[existing];
      updated[existing] =
          line.copyWith(qty: line.qty + (product.isWeighted ? 0.25 : 1));
    } else {
      updated.add(
        CartLine(
          product: product,
          qty: product.isWeighted ? 0.25 : 1,
          isBundle: asBundle,
        ),
      );
    }
    state = CartState(lines: updated);
  }

  void setQty(int index, num qty) {
    if (index < 0 || index >= state.lines.length) return;
    final updated = <CartLine>[...state.lines];
    if (qty <= 0) {
      updated.removeAt(index);
    } else {
      updated[index] = updated[index].copyWith(qty: qty);
    }
    state = CartState(lines: updated);
  }

  void toggleBundle(int index) {
    if (index < 0 || index >= state.lines.length) return;
    final line = state.lines[index];
    if (!line.product.hasBundle) return;
    final updated = <CartLine>[...state.lines];
    updated[index] = line.copyWith(isBundle: !line.isBundle);
    state = CartState(lines: updated);
  }

  void remove(int index) {
    if (index < 0 || index >= state.lines.length) return;
    final updated = <CartLine>[...state.lines]..removeAt(index);
    state = CartState(lines: updated);
  }

  void clear() {
    state = CartState(lines: <CartLine>[]);
  }
}

final cartProvider =
    NotifierProvider<CartController, CartState>(CartController.new);

final tenderedProvider = StateProvider<int>((ref) => 0);
