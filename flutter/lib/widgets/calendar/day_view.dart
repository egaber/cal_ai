import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'dart:math' as math;
import '../../models/calendar_event.dart';
import '../../providers/calendar_provider.dart';

/// Beautiful day view with hourly schedule and current time indicator
class DayView extends ConsumerStatefulWidget {
  const DayView({super.key});

  @override
  ConsumerState<DayView> createState() => _DayViewState();
}

class _DayViewState extends ConsumerState<DayView> {
  late ScrollController _scrollController;
  static const double _hourHeight = 60.0;
  static const double _timeColumnWidth = 60.0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    
    // Scroll to current hour after frame is rendered
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToCurrentTime();
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

  @override
  Widget build(BuildContext context) {
    final selectedDate = ref.watch(selectedDateProvider);
    final events = ref.watch(selectedDateEventsProvider);

    return Column(
      children: [
        _buildDateHeader(context, selectedDate),
        Expanded(
          child: Stack(
            children: [
              _buildHourlyGrid(context, events),
              _buildCurrentTimeIndicator(context, selectedDate),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDateHeader(BuildContext context, DateTime date) {
    final isToday = _isToday(date);
    
    return Container(
      padding: const EdgeInsets.all(16),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isToday ? 'Today' : DateFormat('EEEE').format(date),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                DateFormat('MMMM d, yyyy').format(date),
                style: TextStyle(
                  fontSize: 14,
                  color: CupertinoColors.systemGrey.resolveFrom(context),
                ),
              ),
            ],
          ),
          CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: _scrollToCurrentTime,
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.clock,
                  size: 20,
                  color: CupertinoColors.activeBlue,
                ),
                const SizedBox(width: 4),
                Text(
                  DateFormat('HH:mm').format(DateTime.now()),
                  style: const TextStyle(
                    color: CupertinoColors.activeBlue,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHourlyGrid(BuildContext context, List<CalendarEvent> events) {
    return SingleChildScrollView(
      controller: _scrollController,
      child: SizedBox(
        height: 24 * _hourHeight, // 24 hours
        child: Stack(
          children: [
            // Hour lines and labels
            ...List.generate(24, (hour) => _buildHourRow(context, hour)),
            // Events
            _buildEventBlocks(context, events),
          ],
        ),
      ),
    );
  }

  Widget _buildHourRow(BuildContext context, int hour) {
    final isPastHour = DateTime.now().hour > hour;
    
    return Positioned(
      top: hour * _hourHeight,
      left: 0,
      right: 0,
      height: _hourHeight,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Time label
          SizedBox(
            width: _timeColumnWidth,
            child: Padding(
              padding: const EdgeInsets.only(right: 8, top: 4),
              child: Text(
                DateFormat('HH:mm').format(
                  DateTime(2024, 1, 1, hour),
                ),
                style: TextStyle(
                  fontSize: 12,
                  color: isPastHour
                      ? CupertinoColors.systemGrey2.resolveFrom(context)
                      : CupertinoColors.systemGrey.resolveFrom(context),
                ),
                textAlign: TextAlign.right,
              ),
            ),
          ),
          // Hour line
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: CupertinoColors.separator.resolveFrom(context),
                    width: hour % 3 == 0 ? 1.0 : 0.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventBlocks(BuildContext context, List<CalendarEvent> events) {
    if (events.isEmpty) return const SizedBox.shrink();

    // Sort events by start time
    final sortedEvents = List<CalendarEvent>.from(events)
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    // Calculate overlapping events for better positioning
    final eventBlocks = <Widget>[];
    
    for (int i = 0; i < sortedEvents.length; i++) {
      final event = sortedEvents[i];
      if (event.isAllDay) continue;

      // Calculate overlaps
      int overlapCount = 0;
      int overlapIndex = 0;
      
      for (int j = 0; j < sortedEvents.length; j++) {
        if (i == j) {
          overlapIndex = overlapCount;
          continue;
        }
        
        final other = sortedEvents[j];
        if (other.isAllDay) continue;
        
        if (_eventsOverlap(event, other)) {
          overlapCount++;
        }
      }

      eventBlocks.add(
        _buildEventBlock(
          context,
          event,
          overlapCount + 1,
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

    final leftOffset = _timeColumnWidth + 
                      (overlapIndex * (MediaQuery.of(context).size.width - _timeColumnWidth) / totalOverlaps);
    final width = (MediaQuery.of(context).size.width - _timeColumnWidth) / totalOverlaps - 4;

    return Positioned(
      top: startHour * _hourHeight,
      left: leftOffset,
      width: width,
      height: duration * _hourHeight,
      child: GestureDetector(
        onTap: () => _showEventDetails(context, event),
        child: Container(
          margin: const EdgeInsets.only(right: 2, top: 1, bottom: 1),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: eventColor.withOpacity(0.9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: eventColor,
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: eventColor.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event.title,
                style: const TextStyle(
                  color: CupertinoColors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (duration >= 0.5) ...[
                const SizedBox(height: 2),
                Text(
                  '${DateFormat('h:mm a').format(event.startTime)} - ${DateFormat('h:mm a').format(event.endTime)}',
                  style: const TextStyle(
                    color: CupertinoColors.white,
                    fontSize: 11,
                  ),
                ),
              ],
              if (event.location != null && duration >= 1) ...[
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(
                      CupertinoIcons.location_solid,
                      size: 10,
                      color: CupertinoColors.white,
                    ),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(
                        event.location!,
                        style: const TextStyle(
                          color: CupertinoColors.white,
                          fontSize: 10,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentTimeIndicator(BuildContext context, DateTime selectedDate) {
    if (!_isToday(selectedDate)) {
      return const SizedBox.shrink();
    }

    final now = DateTime.now();
    final currentHour = now.hour + now.minute / 60;
    final topPosition = currentHour * _hourHeight;

    return Positioned(
      top: topPosition,
      left: 0,
      right: 0,
      child: Row(
        children: [
          // Time indicator circle
          Container(
            margin: const EdgeInsets.only(left: _timeColumnWidth - 6),
            width: 12,
            height: 12,
            decoration: const BoxDecoration(
              color: CupertinoColors.systemRed,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0x40FF3B30),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          // Red line
          Expanded(
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: CupertinoColors.systemRed,
                boxShadow: [
                  BoxShadow(
                    color: CupertinoColors.systemRed.withOpacity(0.3),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
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

  bool _eventsOverlap(CalendarEvent a, CalendarEvent b) {
    return a.startTime.isBefore(b.endTime) && a.endTime.isAfter(b.startTime);
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
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
