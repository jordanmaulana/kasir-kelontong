import 'package:flutter/material.dart';

import '../../app/text_styles.dart';
import '../money.dart';

class MoneyText extends StatelessWidget {
  const MoneyText(this.value, {super.key, this.style, this.textAlign});

  final num value;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final base = style ?? DefaultTextStyle.of(context).style;
    return Text(
      formatIdr(value),
      style: base.tabular,
      textAlign: textAlign,
    );
  }
}
