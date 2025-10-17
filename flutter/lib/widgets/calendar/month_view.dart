import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/calendar_event.dart';
import '../../providers/calendar_provider.dart';

/// Beautiful month view calendar with iOS-native feel
class MonthView extends ConsumerStatefulWidget {
  const MonthView({super.key});

  @override
  ConsumerState<MonthView> createState() => _MonthViewState();
}

class _MonthViewState extends ConsumerState<MonthView> {
  late DateTime _displayedMonth;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    final selectedDate = ref.read(selectedDateProvider);
    _displayedMonth = DateTime(selectedDate.year, selectedDate.month);
    _pageController = PageController(initialPage: 1200);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _changeMonth(int delta) {
    setState(() {
      _displayedMonth = DateTime(
        _displayedMonth.year,
        _displayedMonth.month + delta,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final events = ref.watch(calendarEventsProvider);
    final selectedDate = ref.watch(selectedDateProvider);

    return Column(
      children: [
        _buildMonthHeader(context),
        _buildWeekdayHeaders(context),
        Expanded(
          child: _buildCalendarGrid(context, events, selectedDate),
        ),
      ],
    );
  }

  Widget _buildMonthHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: () => _changeMonth(-1),
            child: const Icon(CupertinoIcons.chevron_left),
          ),
          GestureDetector(
            onTap: () => _showMonthYearPicker(context),
            child: Row(
              children: [
                Text(
                  DateFormat('MMMM yyyy').format(_displayedMonth),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  CupertinoIcons.chevron_down,
                  size: 16,
                ),
              ],
            ),
          ),
          CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: () => _changeMonth(1),
            child: const Icon(CupertinoIcons.chevron_right),
          ),
        ],
      ),
    );
  }

  Widget _buildWeekdayHeaders(BuildContext context) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: weekdays.map((day) {
          return Expanded(
            child: Center(
              child: Text(
                day,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: CupertinoColors.systemGrey.resolveFrom(context),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCalendarGrid(
    BuildContext context,
    List<CalendarEvent> events,
    DateTime selectedDate,
  ) {
    final daysInMonth = _getDaysInMonth(_displayedMonth);
    final firstDayOfMonth = DateTime(_displayedMonth.year, _displayedMonth.month, 1);
    final firstWeekday = firstDayOfMonth.weekday % 7;

    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        childAspectRatio: 0.85,
      ),
      itemCount: 42, // 6 weeks
      itemBuilder: (context, index) {
        final dayNumber = index - firstWeekday + 1;
        
        if (dayNumber < 1 || dayNumber > daysInMonth) {
          return const SizedBox.shrink();
        }

        final date = DateTime(_displayedMonth.year, _displayedMonth.month, dayNumber);
        final dayEvents = events.where((e) => e.occursOnDate(date)).toList();
        final isSelected = _isSameDay(date, selectedDate);
        final isToday = _isSameDay(date, DateTime.now());

        return _buildDayCell(
          context,
          date,
          dayNumber,
          dayEvents,
          isSelected,
          isToday,
        );
      },
    );
  }

  Widget _buildDayCell(
    BuildContext context,
    DateTime date,
    int dayNumber,
    List<CalendarEvent> events,
    bool isSelected,
    bool isToday,
  ) {
    return GestureDetector(
      onTap: () {
        ref.read(selectedDateProvider.notifier).state = date;
        // Optionally show day view
      },
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: isSelected
              ? CupertinoColors.activeBlue
              : isToday
                  ? CupertinoColors.activeBlue.withOpacity(0.1)
                  : null,
          borderRadius: BorderRadius.circular(8),
          border: isToday && !isSelected
              ? Border.all(
                  color: CupertinoColors.activeBlue,
                  width: 1.5,
                )
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              dayNumber.toString(),
              style: TextStyle(
                fontSize: 16,
                fontWeight: isToday ? FontWeight.w600 : FontWeight.w400,
                color: isSelected
                    ? CupertinoColors.white
                    : CupertinoColors.label.resolveFrom(context),
              ),
            ),
            const SizedBox(height: 2),
            if (events.isNotEmpty)
              _buildEventDots(context, events, isSelected),
          ],
        ),
      ),
    );
  }

  Widget _buildEventDots(
    BuildContext context,
    List<CalendarEvent> events,
    bool isSelected,
  ) {
    final maxDots = 3;
    final visibleEvents = events.take(maxDots).toList();
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ...visibleEvents.map((event) {
          return Container(
            width: 4,
            height: 4,
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: isSelected
                  ? CupertinoColors.white
                  : _getEventColor(event),
              shape: BoxShape.circle,
            ),
          );
        }),
        if (events.length > maxDots)
          Container(
            width: 4,
            height: 4,
            margin: const EdgeInsets.only(left: 1),
            decoration: BoxDecoration(
              color: isSelected
                  ? CupertinoColors.white
                  : CupertinoColors.systemGrey,
              shape: BoxShape.circle,
            ),
          ),
      ],
    );
  }

  Color _getEventColor(CalendarEvent event) {
    if (event.color != null) {
      return Color(int.parse(event.color!.replaceFirst('#', '0xFF')));
    }
    
    switch (event.type) {
      case EventType.task:
        return CupertinoColors.activeOrange;
      case EventType.meeting:
        return CupertinoColors.activeBlue;
      case EventType.reminder:
        return CupertinoColors.systemRed;
      case EventType.birthday:
        return CupertinoColors.systemPurple;
      case EventType.holiday:
        return CupertinoColors.systemGreen;
      default:
        return CupertinoColors.systemGrey;
    }
  }

  int _getDaysInMonth(DateTime date) {
    return DateTime(date.year, date.month + 1, 0).day;
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Future<void> _showMonthYearPicker(BuildContext context) async {
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (context) => Container(
        height: 300,
        color: CupertinoColors.systemBackground.resolveFrom(context),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    child: const Text('Cancel'),
                    onPressed: () => Navigator.pop(context),
                  ),
                  CupertinoButton(
                    child: const Text('Done'),
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {});
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: CupertinoDatePicker(
                mode: CupertinoDatePickerMode.monthYear,
                initialDateTime: _displayedMonth,
                onDateTimeChanged: (DateTime newDate) {
                  _displayedMonth = newDate;
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
