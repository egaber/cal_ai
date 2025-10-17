import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';

/// Custom text field that highlights parsed elements with colors
class HighlightedTextField extends StatefulWidget {
  final TextEditingController controller;
  final String placeholder;
  final bool autofocus;
  final VoidCallback? onChanged;

  const HighlightedTextField({
    super.key,
    required this.controller,
    required this.placeholder,
    this.autofocus = false,
    this.onChanged,
  });

  @override
  State<HighlightedTextField> createState() => _HighlightedTextFieldState();
}

class _HighlightedTextFieldState extends State<HighlightedTextField> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    setState(() {});
    widget.onChanged?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: CupertinoColors.systemGrey6.resolveFrom(context),
        borderRadius: BorderRadius.circular(8),
      ),
      child: EditableText(
        controller: widget.controller,
        focusNode: FocusNode(),
        style: const TextStyle(
          fontSize: 18,
          color: CupertinoColors.label,
        ),
        cursorColor: CupertinoColors.activeBlue,
        backgroundCursorColor: CupertinoColors.systemGrey,
        maxLines: null,
        autofocus: widget.autofocus,
        textCapitalization: TextCapitalization.sentences,
        strutStyle: const StrutStyle(fontSize: 18),
      ),
    );
  }
}

/// Controller that provides syntax highlighting for task input
class HighlightingTextEditingController extends TextEditingController {
  HighlightingTextEditingController({String? text}) : super(text: text);

  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    final text = this.text;
    if (text.isEmpty) {
      return TextSpan(text: text, style: style);
    }

    final spans = <TextSpan>[];
    final matches = <_Match>[];

    // Find all matches for different patterns
    _addMatches(matches, text, [
      r'\b(today|tomorrow|tonight)\b',
      r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
      r'\b(היום|מחר|מחרתיים|ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)\b',
      r'\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?',
    ], CupertinoColors.systemBlue);

    _addMatches(matches, text, [
      r'\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b',
      r'\b\d{1,2}:\d{2}\b',
    ], CupertinoColors.systemGreen);

    _addMatches(matches, text, [
      r'\b[Pp]1\b',
    ], CupertinoColors.systemRed);

    _addMatches(matches, text, [
      r'\b[Pp]2\b',
    ], CupertinoColors.systemOrange);

    _addMatches(matches, text, [
      r'\b[Pp]3\b',
    ], CupertinoColors.systemYellow);

    _addMatches(matches, text, [
      r'@\w+',
    ], CupertinoColors.systemOrange);

    _addMatches(matches, text, [
      r'#\w+',
    ], CupertinoColors.systemPurple);

    // Sort matches by start position
    matches.sort((a, b) => a.start.compareTo(b.start));

    // Build text spans
    int lastIndex = 0;
    for (final match in matches) {
      // Add unmatched text
      if (match.start > lastIndex) {
        spans.add(TextSpan(
          text: text.substring(lastIndex, match.start),
          style: style,
        ));
      }

      // Add matched text with color
      spans.add(TextSpan(
        text: text.substring(match.start, match.end),
        style: style?.copyWith(
          color: match.color,
          fontWeight: FontWeight.w600,
          backgroundColor: match.color.withOpacity(0.15),
        ),
      ));

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastIndex),
        style: style,
      ));
    }

    return TextSpan(style: style, children: spans);
  }

  void _addMatches(
    List<_Match> matches,
    String text,
    List<String> patterns,
    Color color,
  ) {
    for (final pattern in patterns) {
      final regex = RegExp(pattern, caseSensitive: false);
      for (final match in regex.allMatches(text)) {
        // Check if this position is already matched
        final overlaps = matches.any((m) =>
            (match.start >= m.start && match.start < m.end) ||
            (match.end > m.start && match.end <= m.end));

        if (!overlaps) {
          matches.add(_Match(match.start, match.end, color));
        }
      }
    }
  }
}

class _Match {
  final int start;
  final int end;
  final Color color;

  _Match(this.start, this.end, this.color);
}
