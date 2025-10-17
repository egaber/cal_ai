import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/calendar_event.dart';
import '../../providers/calendar_provider.dart';

/// List of events for the selected date with beautiful iOS styling
class EventList extends ConsumerWidget {
  const EventList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedDateProvider);
    final events = ref.watch(selectedDateEventsProvider);

    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context, selectedDate, events.length),
          Expanded(
            child: events.isEmpty
                ? _buildEmptyState(context)
                : _buildEventsList(context, events),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, DateTime date, int eventCount) {
    final isToday = _isToday(date);
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: CupertinoColors.activeBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '$eventCount ${eventCount == 1 ? 'event' : 'events'}',
                  style: const TextStyle(
                    color: CupertinoColors.activeBlue,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            CupertinoIcons.calendar,
            size: 64,
            color: CupertinoColors.systemGrey.resolveFrom(context),
          ),
          const SizedBox(height: 16),
          Text(
            'No events scheduled',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap + to create a new event',
            style: TextStyle(
              fontSize: 14,
              color: CupertinoColors.systemGrey2.resolveFrom(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventsList(BuildContext context, List<CalendarEvent> events) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: events.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final event = events[index];
        return EventCard(event: event);
      },
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }
}

/// Individual event card with beautiful design
class EventCard extends StatelessWidget {
  const EventCard({
    super.key,
    required this.event,
  });

  final CalendarEvent event;

  @override
  Widget build(BuildContext context) {
    final eventColor = _getEventColor();

    return GestureDetector(
      onTap: () => _showEventDetails(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CupertinoColors.systemBackground.resolveFrom(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: CupertinoColors.separator.resolveFrom(context),
            width: 0.5,
          ),
          boxShadow: [
            BoxShadow(
              color: CupertinoColors.systemGrey.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            _buildColorBar(eventColor),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _buildEventTypeBadge(context),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _buildTimeInfo(context),
                  if (event.location != null) ...[
                    const SizedBox(height: 4),
                    _buildLocationInfo(context),
                  ],
                  if (event.description != null && event.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      event.description!,
                      style: TextStyle(
                        fontSize: 14,
                        color: CupertinoColors.systemGrey.resolveFrom(context),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
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

  Widget _buildColorBar(Color color) {
    return Container(
      width: 4,
      height: 60,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildEventTypeBadge(BuildContext context) {
    IconData icon;
    switch (event.type) {
      case EventType.task:
        icon = CupertinoIcons.checkmark_circle;
        break;
      case EventType.meeting:
        icon = CupertinoIcons.person_2;
        break;
      case EventType.reminder:
        icon = CupertinoIcons.bell;
        break;
      case EventType.birthday:
        icon = CupertinoIcons.gift;
        break;
      case EventType.holiday:
        icon = CupertinoIcons.sun_max;
        break;
      default:
        icon = CupertinoIcons.calendar;
    }

    return Icon(
      icon,
      size: 16,
      color: CupertinoColors.systemGrey.resolveFrom(context),
    );
  }

  Widget _buildTimeInfo(BuildContext context) {
    String timeText;
    if (event.isAllDay) {
      timeText = 'All day';
    } else {
      final startTime = DateFormat('h:mm a').format(event.startTime);
      final endTime = DateFormat('h:mm a').format(event.endTime);
      timeText = '$startTime - $endTime';
    }

    return Row(
      children: [
        Icon(
          CupertinoIcons.clock,
          size: 14,
          color: CupertinoColors.systemGrey.resolveFrom(context),
        ),
        const SizedBox(width: 4),
        Text(
          timeText,
          style: TextStyle(
            fontSize: 14,
            color: CupertinoColors.systemGrey.resolveFrom(context),
          ),
        ),
        if (event.isOngoing) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: CupertinoColors.systemGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(
                  CupertinoIcons.circle_fill,
                  size: 6,
                  color: CupertinoColors.systemGreen,
                ),
                SizedBox(width: 4),
                Text(
                  'Now',
                  style: TextStyle(
                    fontSize: 11,
                    color: CupertinoColors.systemGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLocationInfo(BuildContext context) {
    return Row(
      children: [
        Icon(
          CupertinoIcons.location,
          size: 14,
          color: CupertinoColors.systemGrey.resolveFrom(context),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            event.location!,
            style: TextStyle(
              fontSize: 14,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Color _getEventColor() {
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

  void _showEventDetails(BuildContext context) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (context) => EventDetailsSheet(event: event),
    );
  }
}

/// Event details bottom sheet
class EventDetailsSheet extends StatelessWidget {
  const EventDetailsSheet({
    super.key,
    required this.event,
  });

  final CalendarEvent event;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
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
                  _buildTitle(),
                  const SizedBox(height: 24),
                  _buildInfoRow(
                    CupertinoIcons.clock,
                    'Time',
                    _getTimeString(),
                  ),
                  if (event.location != null) ...[
                    const SizedBox(height: 16),
                    _buildInfoRow(
                      CupertinoIcons.location,
                      'Location',
                      event.location!,
                    ),
                  ],
                  if (event.description != null && event.description!.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildDescription(),
                  ],
                  if (event.attendees.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildAttendees(),
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

  Widget _buildTitle() {
    return Text(
      event.title,
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: CupertinoColors.activeBlue),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: CupertinoColors.systemGrey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Description',
          style: TextStyle(
            fontSize: 12,
            color: CupertinoColors.systemGrey,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          event.description!,
          style: const TextStyle(fontSize: 16),
        ),
      ],
    );
  }

  Widget _buildAttendees() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Attendees',
          style: TextStyle(
            fontSize: 12,
            color: CupertinoColors.systemGrey,
          ),
        ),
        const SizedBox(height: 8),
        ...event.attendees.map((attendee) => Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Row(
            children: [
              const Icon(
                CupertinoIcons.person_circle,
                size: 20,
                color: CupertinoColors.activeBlue,
              ),
              const SizedBox(width: 8),
              Text(attendee, style: const TextStyle(fontSize: 16)),
            ],
          ),
        )),
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
