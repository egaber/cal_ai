import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'dart:math' as math;
import '../../models/calendar_event.dart';
import '../../providers/calendar_provider.dart';

/// Beautiful 3-day view with hourly schedule and current time indicator
class ThreeDayView extends ConsumerStatefulWidget {
  const ThreeDayView({super.key});

  @override
  ConsumerState<ThreeDayView> createState() => _ThreeDayViewState();
}

class _ThreeDayViewState extends ConsumerState<ThreeDayView> {
  late ScrollController _scrollController;
  static const double _hourHeight = 60.0;
  static const double _timeColumnWidth = 50.0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    
    // Scroll to current hour after frame is rendered
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToCurrentTime();
      // Update the UI every minute to keep red bar position accurate
      Future.delayed(const Duration(minutes: 1), () {
        if (mounted) {
          setState(() {});
        }
      });
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrentTime() {
    final now = DateTime.now();
    final currentHour = now.hour;
    final currentMinute = now.minute;
    
    // Calculate position (subtract 2 hours to center current time)
    final targetPosition = math.max(
      0.0,
      (currentHour - 2) * _hourHeight + (currentMinute / 60 * _hourHeight),
    );
    
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        targetPosition,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  List<DateTime> _getThreeDays() {
    final selectedDate = ref.watch(selectedDateProvider);
    final yesterday = selectedDate.subtract(const Duration(days: 1));
    final tomorrow = selectedDate.add(const Duration(days: 1));
    return [yesterday, selectedDate, tomorrow];
  }

  @override
  Widget build(BuildContext context) {
    final threeDays = _getThreeDays();
    final events = ref.watch(calendarEventsProvider);

    return Column(
      children: [
        _buildDateHeaders(context, threeDays),
        Expanded(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              _buildHourlyGrid(context, threeDays, events),
              _buildCurrentTimeIndicator(context, threeDays),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDateHeaders(BuildContext context, List<DateTime> days) {
    final now = DateTime.now();
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        border: Border(
          bottom: BorderSide(
            color: CupertinoColors.separator.resolveFrom(context),
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          // Time column spacer
          SizedBox(width: _timeColumnWidth),
          // Day headers
          ...days.map((day) {
            final isToday = _isSameDay(day, now);
            final dayLabel = _getDayLabel(day);
            
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  ref.read(selectedDateProvider.notifier).state = day;
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isToday
                        ? CupertinoColors.activeBlue.withOpacity(0.1)
                        : null,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        dayLabel,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isToday
                              ? CupertinoColors.activeBlue
                              : CupertinoColors.systemGrey.resolveFrom(context),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('d').format(day),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: isToday
                              ? CupertinoColors.activeBlue
                              : CupertinoColors.label.resolveFrom(context),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildHourlyGrid(
    BuildContext context,
    List<DateTime> days,
    List<CalendarEvent> allEvents,
  ) {
    return SingleChildScrollView(
      controller: _scrollController,
      child: SizedBox(
        height: 24 * _hourHeight, // 24 hours
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time column
            _buildTimeColumn(context),
            // Day columns
            ...days.map((day) {
              final dayEvents = allEvents
                  .where((event) => event.occursOnDate(day))
                  .toList();
              return Expanded(
                child: _buildDayColumn(context, day, dayEvents),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeColumn(BuildContext context) {
    return SizedBox(
      width: _timeColumnWidth,
      child: Stack(
        children: List.generate(24, (hour) {
          final isPastHour = DateTime.now().hour > hour;
          
          return Positioned(
            top: hour * _hourHeight,
            left: 0,
            right: 0,
            height: _hourHeight,
            child: Padding(
              padding: const EdgeInsets.only(right: 4, top: 4),
              child: Text(
                DateFormat('HH:mm').format(
                  DateTime(2024, 1, 1, hour),
                ),
                style: TextStyle(
                  fontSize: 11,
                  color: isPastHour
                      ? CupertinoColors.systemGrey2.resolveFrom(context)
                      : CupertinoColors.systemGrey.resolveFrom(context),
                ),
                textAlign: TextAlign.right,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildDayColumn(
    BuildContext context,
    DateTime day,
    List<CalendarEvent> events,
  ) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: CupertinoColors.separator.resolveFrom(context),
            width: 0.5,
          ),
        ),
      ),
      child: Stack(
        children: [
          // Hour lines
          ...List.generate(24, (hour) {
            return Positioned(
              top: hour * _hourHeight,
              left: 0,
              right: 0,
              height: _hourHeight,
              child: Container(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: CupertinoColors.separator.resolveFrom(context),
                      width: hour % 3 == 0 ? 0.5 : 0.25,
                    ),
                  ),
                ),
              ),
            );
          }),
          // Events
          _buildEventBlocks(context, day, events),
        ],
      ),
    );
  }

  Widget _buildEventBlocks(
    BuildContext context,
    DateTime day,
    List<CalendarEvent> events,
  ) {
    if (events.isEmpty) return const SizedBox.shrink();

    final sortedEvents = List<CalendarEvent>.from(events)
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    final eventBlocks = <Widget>[];
    
    for (int i = 0; i < sortedEvents.length; i++) {
      final event = sortedEvents[i];
      if (event.isAllDay) continue;

      // Calculate overlaps for positioning
      final overlappingEvents = sortedEvents.where((other) {
        return other != event &&
               !other.isAllDay &&
               _eventsOverlap(event, other);
      }).toList();

      final totalOverlaps = overlappingEvents.length + 1;
      final overlapIndex = overlappingEvents
          .where((other) => other.startTime.isBefore(event.startTime))
          .length;

      eventBlocks.add(
        _buildEventBlock(
          context,
          event,
          totalOverlaps,
          overlapIndex,
        ),
      );
    }

    return Stack(children: eventBlocks);
  }

  Widget _buildEventBlock(
    BuildContext context,
    CalendarEvent event,
    int totalOverlaps,
    int overlapIndex,
  ) {
    final startHour = event.startTime.hour + event.startTime.minute / 60;
    final duration = event.duration.inMinutes / 60;
    final eventColor = _getEventColor(event);

    // Calculate width to fit within the day column
    final screenWidth = MediaQuery.of(context).size.width;
    final availableWidth = (screenWidth - _timeColumnWidth) / 3;
    final leftOffset = (overlapIndex * availableWidth / totalOverlaps);
    final width = (availableWidth / totalOverlaps) - 4;

    return Positioned(
      top: startHour * _hourHeight,
      left: leftOffset + 2,
      width: width,
      height: duration * _hourHeight,
      child: GestureDetector(
        onTap: () => _showEventDetails(context, event),
        child: Container(
          margin: const EdgeInsets.only(right: 2, top: 1, bottom: 1),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: eventColor.withOpacity(0.9),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: eventColor,
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event.title,
                style: const TextStyle(
                  color: CupertinoColors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (duration >= 0.5) ...[
                const SizedBox(height: 2),
                Text(
                  DateFormat('h:mm a').format(event.startTime),
                  style: const TextStyle(
                    color: CupertinoColors.white,
                    fontSize: 9,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentTimeIndicator(
    BuildContext context,
    List<DateTime> days,
  ) {
    final now = DateTime.now();
    
    // Check if today is one of the displayed days
    final todayIndex = days.indexWhere((day) => _isSameDay(day, now));
    if (todayIndex == -1) {
      return const SizedBox.shrink();
    }

    final currentHour = now.hour + now.minute / 60;
    final topPosition = currentHour * _hourHeight;

    return Positioned(
      top: topPosition - 1.5, // Center the line
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Container(
          height: 3,
          decoration: BoxDecoration(
            color: CupertinoColors.systemRed,
            boxShadow: const [
              BoxShadow(
                color: Color(0xFFFF3B30),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Row(
            children: [
              // Time indicator circle at the start
              Container(
                margin: const EdgeInsets.only(left: _timeColumnWidth - 10),
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: CupertinoColors.systemRed,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: CupertinoColors.white,
                    width: 3,
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0xFFFF3B30),
                      blurRadius: 12,
                      spreadRadius: 3,
                    ),
                  ],
                ),
              ),
              // Red line extending across
              const Expanded(child: SizedBox()),
            ],
          ),
        ),
      ),
    );
  }

  String _getDayLabel(DateTime date) {
    final now = DateTime.now();
    if (_isSameDay(date, now)) return 'Today';
    if (_isSameDay(date, now.subtract(const Duration(days: 1)))) {
      return 'Yesterday';
    }
    if (_isSameDay(date, now.add(const Duration(days: 1)))) return 'Tomorrow';
    return DateFormat('EEE').format(date);
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

  bool _eventsOverlap(CalendarEvent a, CalendarEvent b) {
    return a.startTime.isBefore(b.endTime) && a.endTime.isAfter(b.startTime);
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  void _showEventDetails(BuildContext context, CalendarEvent event) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (context) => _EventDetailsSheet(event: event),
    );
  }
}

class _EventDetailsSheet extends StatelessWidget {
  const _EventDetailsSheet({required this.event});

  final CalendarEvent event;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    event.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    CupertinoIcons.clock,
                    _getTimeString(),
                  ),
                  if (event.location != null) ...[
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      CupertinoIcons.location,
                      event.location!,
                    ),
                  ],
                  if (event.description != null && event.description!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      event.description!,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: CupertinoColors.separator.resolveFrom(context),
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Event Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: () => Navigator.pop(context),
            child: const Icon(CupertinoIcons.xmark_circle_fill),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: CupertinoColors.activeBlue),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 16),
          ),
        ),
      ],
    );
  }

  String _getTimeString() {
    if (event.isAllDay) {
      return 'All day';
    }
    final startTime = DateFormat('h:mm a').format(event.startTime);
    final endTime = DateFormat('h:mm a').format(event.endTime);
    return '$startTime - $endTime';
  }
}
