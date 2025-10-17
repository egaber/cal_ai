import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
class TodosTab extends StatelessWidget {
  const TodosTab({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Todos'),
        trailing: Icon(CupertinoIcons.search),
      ),
      child: SafeArea(
        child: Stack(
          children: [
            // Task list will go here
            Center(
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
                ],
              ),
            ),
            
            // Floating action button
            Positioned(
              right: 16,
              bottom: 16,
              child: CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () {
                  // TODO: Show task creation dialog
                  showCupertinoDialog<void>(
                    context: context,
                    builder: (context) => CupertinoAlertDialog(
                      title: const Text('Create Task'),
                      content: const Text('Task creation coming soon!'),
                      actions: [
                        CupertinoDialogAction(
                          child: const Text('OK'),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                  );
                },
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
}

/// Calendar tab - Event viewing and scheduling (Future phase).
class CalendarTab extends StatelessWidget {
  const CalendarTab({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Calendar'),
      ),
      child: Center(
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
              'Calendar coming soon',
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
