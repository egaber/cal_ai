import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import '../services/task_parser_service.dart';
import 'highlighted_text_field.dart';

/// Task creation bottom sheet with intelligent text parsing
/// 
/// Features:
/// - Real-time NLP parsing as user types
/// - Displays extracted date, time, location, priority
/// - Click to edit extracted fields
/// - Support for recurring tasks and reminders
/// - Works in both English and Hebrew
class TaskCreationSheet extends ConsumerStatefulWidget {
  final Task? existingTask;

  const TaskCreationSheet({
    super.key,
    this.existingTask,
  });

  @override
  ConsumerState<TaskCreationSheet> createState() => _TaskCreationSheetState();
}

class _TaskCreationSheetState extends ConsumerState<TaskCreationSheet> {
  late final HighlightingTextEditingController _textController;
  final _descriptionController = TextEditingController();
  final _parser = TaskParserService();
  final _uuid = const Uuid();

  ParsedTaskData? _parsedData;
  DateTime? _selectedDate;
  DateTime? _selectedTime;
  String? _selectedLocation;
  TaskPriority _selectedPriority = TaskPriority.none;
  RecurrencePattern _recurrence = RecurrencePattern.none;
  List<TaskReminder> _reminders = [];
  bool _showAdvanced = false;

  @override
  void initState() {
    super.initState();
    
    // Initialize highlighting controller
    _textController = HighlightingTextEditingController(
      text: widget.existingTask?.title ?? '',
    );
    
    // If editing existing task, populate fields
    if (widget.existingTask != null) {
      final task = widget.existingTask!;
      _descriptionController.text = task.description ?? '';
      _selectedDate = task.dueDate;
      _selectedTime = task.dueTime;
      _selectedLocation = task.location;
      _selectedPriority = task.priority;
      _recurrence = task.recurrence;
      _reminders = List.from(task.reminders);
    }

    // Listen to text changes for real-time parsing
    _textController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _textController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final text = _textController.text;
    if (text.isEmpty) {
      setState(() => _parsedData = null);
      return;
    }

    final parsed = _parser.parseTaskInput(text);
    setState(() {
      _parsedData = parsed;
      // Auto-apply parsed values if not manually set
      if (_selectedDate == null && parsed.dueDate != null) {
        _selectedDate = parsed.dueDate;
      }
      if (_selectedTime == null && parsed.dueTime != null) {
        _selectedTime = parsed.dueTime;
      }
      if (_selectedLocation == null && parsed.location != null) {
        _selectedLocation = parsed.location;
      }
      if (_selectedPriority == TaskPriority.none && 
          parsed.priority != TaskPriority.none) {
        _selectedPriority = parsed.priority;
      }
    });
  }

  void _saveTask() {
    print('=== SAVE TASK CALLED ===');
    final title = _parsedData?.cleanTitle ?? _textController.text.trim();
    print('Title: $title');
    
    if (title.isEmpty) {
      print('Title is empty, returning');
      return;
    }

    final task = Task(
      id: widget.existingTask?.id ?? _uuid.v4(),
      title: title,
      description: _descriptionController.text.trim().isEmpty 
          ? null 
          : _descriptionController.text.trim(),
      priority: _selectedPriority,
      createdAt: widget.existingTask?.createdAt ?? DateTime.now(),
      dueDate: _selectedDate,
      dueTime: _selectedTime,
      location: _selectedLocation,
      recurrence: _recurrence,
      reminders: _reminders,
      tags: _parsedData?.tags ?? [],
    );

    print('Task created: ${task.title}, Priority: ${task.priority}');
    print('Popping with task...');
    Navigator.of(context).pop(task);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 36,
            height: 5,
            decoration: BoxDecoration(
              color: CupertinoColors.systemGrey3.resolveFrom(context),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  child: const Text('Cancel'),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                Text(
                  widget.existingTask != null ? 'Edit Task' : 'New Task',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  child: const Text(
                    'Save',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  onPressed: _saveTask,
                ),
              ],
            ),
          ),
          
          Container(
            height: 1,
            color: CupertinoColors.separator.resolveFrom(context),
          ),
          
          // Content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
            // Main title input with parsing
            _buildTitleInput(),
            
            const SizedBox(height: 16),
            
            // Parsed data display chips
            if (_parsedData != null) _buildParsedDataChips(),
            
            const SizedBox(height: 8),
            
            // Quick action buttons
            _buildQuickActions(),
            
            const SizedBox(height: 16),
            
            // Description
            _buildDescriptionInput(),
            
            const SizedBox(height: 16),
            
            // Advanced options toggle
            _buildAdvancedToggle(),
            
                if (_showAdvanced) ...[
                  const SizedBox(height: 16),
                  _buildRecurrenceSection(),
                  const SizedBox(height: 16),
                  _buildRemindersSection(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleInput() {
    return CupertinoTextField(
      controller: _textController,
      placeholder: 'e.g., "Buy milk tomorrow 3pm P1 @Store"',
      style: const TextStyle(fontSize: 18),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: CupertinoColors.systemGrey6,
        borderRadius: BorderRadius.circular(8),
      ),
      maxLines: null,
      textCapitalization: TextCapitalization.sentences,
      autofocus: widget.existingTask == null,
    );
  }

  Widget _buildParsedDataChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (_selectedDate != null)
          _buildChip(
            icon: CupertinoIcons.calendar,
            label: _parser.formatDate(_selectedDate),
            color: CupertinoColors.systemBlue,
            onTap: _pickDate,
            onDelete: () => setState(() => _selectedDate = null),
          ),
        if (_selectedTime != null)
          _buildChip(
            icon: CupertinoIcons.time,
            label: _parser.formatTime(_selectedTime),
            color: CupertinoColors.systemGreen,
            onTap: _pickTime,
            onDelete: () => setState(() => _selectedTime = null),
          ),
        if (_selectedLocation != null)
          _buildChip(
            icon: CupertinoIcons.location_fill,
            label: _selectedLocation!,
            color: CupertinoColors.systemOrange,
            onTap: _editLocation,
            onDelete: () => setState(() => _selectedLocation = null),
          ),
        if (_selectedPriority != TaskPriority.none)
          _buildChip(
            icon: CupertinoIcons.flag_fill,
            label: _selectedPriority.label,
            color: _getPriorityColor(_selectedPriority),
            onTap: _selectPriority,
            onDelete: () => setState(() => _selectedPriority = TaskPriority.none),
          ),
        if (_parsedData != null && _parsedData!.tags.isNotEmpty)
          ..._parsedData!.tags.map((tag) => _buildChip(
            icon: CupertinoIcons.tag_fill,
            label: '#$tag',
            color: CupertinoColors.systemPurple,
          )),
      ],
    );
  }

  Widget _buildChip({
    required IconData icon,
    required String label,
    required Color color,
    VoidCallback? onTap,
    VoidCallback? onDelete,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(color: color, fontSize: 14),
            ),
            if (onDelete != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onDelete,
                child: Icon(
                  CupertinoIcons.xmark_circle_fill,
                  size: 16,
                  color: color.withOpacity(0.7),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        _buildQuickActionButton(
          icon: CupertinoIcons.calendar,
          label: 'Date',
          onTap: _pickDate,
        ),
        const SizedBox(width: 8),
        _buildQuickActionButton(
          icon: CupertinoIcons.time,
          label: 'Time',
          onTap: _pickTime,
        ),
        const SizedBox(width: 8),
        _buildQuickActionButton(
          icon: CupertinoIcons.location,
          label: 'Location',
          onTap: _editLocation,
        ),
        const SizedBox(width: 8),
        _buildQuickActionButton(
          icon: CupertinoIcons.flag,
          label: 'Priority',
          onTap: _selectPriority,
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: CupertinoButton(
        padding: const EdgeInsets.symmetric(vertical: 8),
        color: CupertinoColors.systemGrey6,
        borderRadius: BorderRadius.circular(8),
        onPressed: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: CupertinoColors.activeBlue),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: CupertinoColors.label,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionInput() {
    return CupertinoTextField(
      controller: _descriptionController,
      placeholder: 'Add description...',
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: CupertinoColors.systemGrey6,
        borderRadius: BorderRadius.circular(8),
      ),
      maxLines: 4,
      textCapitalization: TextCapitalization.sentences,
    );
  }

  Widget _buildAdvancedToggle() {
    return CupertinoButton(
      padding: EdgeInsets.zero,
      onPressed: () => setState(() => _showAdvanced = !_showAdvanced),
      child: Row(
        children: [
          Icon(
            _showAdvanced 
                ? CupertinoIcons.chevron_down 
                : CupertinoIcons.chevron_right,
            size: 16,
          ),
          const SizedBox(width: 8),
          const Text('Advanced Options'),
        ],
      ),
    );
  }

  Widget _buildRecurrenceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recurrence',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        CupertinoButton(
          padding: const EdgeInsets.all(12),
          color: CupertinoColors.systemGrey6,
          borderRadius: BorderRadius.circular(8),
          onPressed: _selectRecurrence,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _recurrence.description,
                style: const TextStyle(color: CupertinoColors.label),
              ),
              const Icon(
                CupertinoIcons.chevron_right,
                size: 16,
                color: CupertinoColors.systemGrey,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRemindersSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Reminders',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              child: const Icon(CupertinoIcons.add_circled),
              onPressed: _addReminder,
            ),
          ],
        ),
        if (_reminders.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'No reminders set',
              style: TextStyle(color: CupertinoColors.systemGrey),
            ),
          )
        else
          ..._reminders.map((reminder) => _buildReminderItem(reminder)),
      ],
    );
  }

  Widget _buildReminderItem(TaskReminder reminder) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: CupertinoColors.systemGrey6,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(CupertinoIcons.bell, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(_parser.formatDate(reminder.dateTime) +
                  ' at ' +
                  _parser.formatTime(reminder.dateTime)),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              child: const Icon(CupertinoIcons.delete, size: 16),
              onPressed: () {
                setState(() {
                  _reminders.remove(reminder);
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.p1:
        return CupertinoColors.systemRed;
      case TaskPriority.p2:
        return CupertinoColors.systemOrange;
      case TaskPriority.p3:
        return CupertinoColors.systemYellow;
      case TaskPriority.none:
        return CupertinoColors.systemGrey;
    }
  }

  Future<void> _pickDate() async {
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => Container(
        height: 216,
        padding: const EdgeInsets.only(top: 6),
        margin: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        color: CupertinoColors.systemBackground.resolveFrom(context),
        child: SafeArea(
          top: false,
          child: CupertinoDatePicker(
            initialDateTime: _selectedDate ?? DateTime.now(),
            mode: CupertinoDatePickerMode.date,
            use24hFormat: true,
            onDateTimeChanged: (DateTime newDate) {
              setState(() => _selectedDate = newDate);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _pickTime() async {
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => Container(
        height: 216,
        padding: const EdgeInsets.only(top: 6),
        margin: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        color: CupertinoColors.systemBackground.resolveFrom(context),
        child: SafeArea(
          top: false,
          child: CupertinoDatePicker(
            initialDateTime: _selectedTime ?? DateTime.now(),
            mode: CupertinoDatePickerMode.time,
            use24hFormat: false,
            onDateTimeChanged: (DateTime newTime) {
              setState(() => _selectedTime = newTime);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _editLocation() async {
    final controller = TextEditingController(text: _selectedLocation ?? '');
    
    await showCupertinoDialog<void>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Location'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: CupertinoTextField(
            controller: controller,
            placeholder: 'Enter location',
            autofocus: true,
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('Set'),
            onPressed: () {
              setState(() => _selectedLocation = controller.text.trim());
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  Future<void> _selectPriority() async {
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text('Select Priority'),
        actions: TaskPriority.values.map((priority) {
          return CupertinoActionSheetAction(
            onPressed: () {
              setState(() => _selectedPriority = priority);
              Navigator.of(context).pop();
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  CupertinoIcons.flag_fill,
                  color: _getPriorityColor(priority),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(priority.description),
              ],
            ),
          );
        }).toList(),
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  Future<void> _selectRecurrence() async {
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text('Repeat'),
        actions: RecurrencePattern.values.map((pattern) {
          return CupertinoActionSheetAction(
            onPressed: () {
              setState(() => _recurrence = pattern);
              Navigator.of(context).pop();
            },
            child: Text(pattern.description),
          );
        }).toList(),
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  Future<void> _addReminder() async {
    DateTime? reminderDate;
    DateTime? reminderTime;

    await showCupertinoDialog<void>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Add Reminder'),
        content: const Text('Set reminder date and time'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('Set'),
            onPressed: () async {
              // Show date picker first
              await showCupertinoModalPopup<void>(
                context: context,
                builder: (context) => Container(
                  height: 216,
                  color: CupertinoColors.systemBackground.resolveFrom(context),
                  child: CupertinoDatePicker(
                    initialDateTime: DateTime.now(),
                    mode: CupertinoDatePickerMode.dateAndTime,
                    onDateTimeChanged: (DateTime value) {
                      reminderDate = value;
                      reminderTime = value;
                    },
                  ),
                ),
              );

              if (reminderDate != null && reminderTime != null) {
                final reminderDateTime = DateTime(
                  reminderDate!.year,
                  reminderDate!.month,
                  reminderDate!.day,
                  reminderTime!.hour,
                  reminderTime!.minute,
                );

                setState(() {
                  _reminders.add(TaskReminder(
                    id: _uuid.v4(),
                    dateTime: reminderDateTime,
                    message: 'Task reminder',
                  ));
                });
              }
              
              if (context.mounted) {
                Navigator.of(context).pop();
              }
            },
          ),
        ],
      ),
    );
  }
}
