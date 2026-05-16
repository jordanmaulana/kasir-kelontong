import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/colors.dart';

class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    this.label,
    this.hint,
    this.helper,
    this.errorText,
    this.controller,
    this.initialValue,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.autofocus = false,
    this.autocorrect = true,
    this.enabled = true,
    this.readOnly = false,
    this.prefixIcon,
    this.suffix,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.inputFormatters,
    this.focusNode,
  });

  final String? label;
  final String? hint;
  final String? helper;
  final String? errorText;
  final TextEditingController? controller;
  final String? initialValue;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool autofocus;
  final bool autocorrect;
  final bool enabled;
  final bool readOnly;
  final IconData? prefixIcon;
  final Widget? suffix;
  final int maxLines;
  final int? minLines;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(label!, style: theme.textTheme.labelMedium),
          const SizedBox(height: 6),
        ],
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          obscureText: obscureText,
          autofocus: autofocus,
          autocorrect: autocorrect,
          enabled: enabled,
          readOnly: readOnly,
          maxLines: obscureText ? 1 : maxLines,
          minLines: minLines,
          maxLength: maxLength,
          inputFormatters: inputFormatters,
          focusNode: focusNode,
          style: theme.textTheme.bodyLarge,
          decoration: InputDecoration(
            hintText: hint,
            errorText: errorText,
            helperText: helper,
            prefixIcon: prefixIcon == null
                ? null
                : Icon(prefixIcon, color: AppColors.mutedFg),
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}
