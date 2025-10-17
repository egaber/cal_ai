import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'models/task.dart';
import 'providers/task_provider.dart';
import 'providers/calendar_provider.dart';
import 'widgets/task_creation_sheet.dart';
import 'widgets/task_item.dart';
import 'widgets/calendar/month_view.dart';
import 'widgets/calendar/event_list.dart';
import 'widgets/calendar/day_view.dart';

/// Main entry point for the Calendar AI Flutter app.
/// 
/// This app provides a native iOS experience for task management,
/// calendar viewing, and AI chat assistance.
void main() {
  runApp(
    const ProviderScope(
      child: CalendarAIApp(),
    ),
  );
}

/// Root application widget.
/// 
/// Uses CupertinoApp for iOS-native feel across all platforms.
class CalendarAIApp extends StatelessWidget {
  const CalendarAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      title: 'Calendar AI',
      theme: CupertinoThemeData(
        primaryColor: CupertinoColors.activeBlue,
        brightness: Brightness.light,
      ),
      home: MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

/// Main screen with bottom tab navigation.
/// 
/// Provides three tabs:
/// 1. Todos - Task management (Todoist-inspired)
/// 2. Calendar - Event viewing and scheduling
/// 3. AI Chat - Intelligent assistant
class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.checkmark_circle),
            label: 'Todos',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.calendar),
            label: 'Calendar',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.chat_bubble_2),
            label: 'AI Chat',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return const TodosTab();
          case 1:
            return const CalendarTab();
          case 2:
            return const ChatTab();
          default:
            return const TodosTab();
        }
      },
    );
  }
}

/// Todos tab - Task management screen (Phase 1 focus).
/// 
/// Features:
/// - List of tasks with circular checkboxes
/// - Time badges with color coding
/// - Floating action button for quick task creation
/// - Pull-to-refresh
/// - Task details drawer on tap
/// - NLP-powered task creation with Hebrew support
class TodosTab extends ConsumerWidget {
  const TodosTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allTasks = ref.watch(taskProvider);

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Todos'),
        trailing: Icon(CupertinoIcons.search),
      ),
      child: SafeArea(
        child: Stack(
          children: [
            // Task list
            allTasks.isEmpty
                ? _buildEmptyState(context)
                : CustomScrollView(
                    slivers: [
                      CupertinoSliverRefreshControl(
                        onRefresh: () async {
                          // Simulate refresh
                          await Future.delayed(const Duration(seconds: 1));
                        },
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.only(top: 8, bottom: 80),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              return TaskItem(task: allTasks[index]);
                            },
                            childCount: allTasks.length,
                          ),
                        ),
                      ),
                    ],
                  ),
            
            // Floating action button
            Positioned(
              right: 16,
              bottom: 16,
              child: CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => _showTaskCreation(context, ref),
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                    color: CupertinoColors.activeBlue,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x40000000),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    CupertinoIcons.add,
                    color: CupertinoColors.white,
                    size: 28,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            CupertinoIcons.checkmark_circle,
            size: 64,
            color: CupertinoColors.systemGrey.resolveFrom(context),
          ),
          const SizedBox(height: 16),
          Text(
            'No tasks yet',
            style: CupertinoTheme.of(context)
                .textTheme
                .navLargeTitleTextStyle
                .copyWith(
                  color: CupertinoColors.systemGrey.resolveFrom(context),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap + to create your first task',
            style: TextStyle(
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Try: "Buy milk tomorrow 3pm P1 @Store"',
            style: TextStyle(
              color: CupertinoColors.systemGrey2.resolveFrom(context),
              fontSize: 14,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showTaskCreation(BuildContext context, WidgetRef ref) async {
    print('=== SHOWING TASK CREATION SHEET ===');
    final result = await showCupertinoModalPopup<Task>(
      context: context,
      barrierColor: CupertinoColors.black.withOpacity(0.35),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: CupertinoColors.systemBackground.resolveFrom(context),
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(20),
          ),
        ),
        child: const TaskCreationSheet(),
      ),
    );
    
    print('=== MODAL CLOSED ===');
    print('Result: $result');
    
    if (result != null) {
      print('Adding task to provider: ${result.title}');
      ref.read(taskProvider.notifier).addTask(result);
      print('Task added successfully');
    } else {
      print('Result was null, task not added');
    }
  }
}

/// Calendar tab - Beautiful event viewing and scheduling.
/// 
/// Features:
/// - Month view with event dots
/// - Day view with hourly schedule and current time indicator
/// - Selected date highlighting
/// - Event list for selected date
/// - Event details modal
/// - Smooth animations and transitions
/// - iOS-native design
class CalendarTab extends ConsumerStatefulWidget {
  const CalendarTab({super.key});

  @override
  ConsumerState<CalendarTab> createState() => _CalendarTabState();
}

class _CalendarTabState extends ConsumerState<CalendarTab> {
  CalendarViewMode _viewMode = CalendarViewMode.month;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: CupertinoSegmentedControl<CalendarViewMode>(
          groupValue: _viewMode,
          onValueChanged: (value) {
            setState(() {
              _viewMode = value;
            });
          },
          children: const {
            CalendarViewMode.month: Padding(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Text('Month', style: TextStyle(fontSize: 13)),
            ),
            CalendarViewMode.day: Padding(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Text('Day', style: TextStyle(fontSize: 13)),
            ),
          },
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: _goToToday,
              child: const Text('Today'),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => _showAddEventSheet(context),
              child: const Icon(CupertinoIcons.add),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: _buildViewContent(),
      ),
    );
  }

  Widget _buildViewContent() {
    switch (_viewMode) {
      case CalendarViewMode.month:
        return Column(
          children: [
            // Month calendar view
            Expanded(
              flex: 3,
              child: const MonthView(),
            ),
            // Event list for selected date
            Expanded(
              flex: 2,
              child: const EventList(),
            ),
          ],
        );
      case CalendarViewMode.day:
        return const DayView();
      case CalendarViewMode.week:
        // Week view not implemented yet
        return const Center(
          child: Text('Week view coming soon'),
        );
    }
  }

  void _goToToday() {
    ref.read(selectedDateProvider.notifier).state = DateTime.now();
  }

  void _showAddEventSheet(BuildContext context) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: CupertinoColors.systemBackground.resolveFrom(context),
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(20),
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  CupertinoIcons.calendar_badge_plus,
                  size: 64,
                  color: CupertinoColors.activeBlue,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Add Event',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Event creation coming soon',
                  style: TextStyle(
                    fontSize: 16,
                    color: CupertinoColors.systemGrey.resolveFrom(context),
                  ),
                ),
                const SizedBox(height: 24),
                CupertinoButton.filled(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// AI Chat tab - Intelligent assistant (Future phase).
class ChatTab extends StatelessWidget {
  const ChatTab({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('AI Chat'),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              CupertinoIcons.chat_bubble_2,
              size: 64,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
            const SizedBox(height: 16),
            Text(
              'AI Chat coming soon',
              style: CupertinoTheme.of(context)
                  .textTheme
                  .navLargeTitleTextStyle
                  .copyWith(
                    color: CupertinoColors.systemGrey.resolveFrom(context),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
