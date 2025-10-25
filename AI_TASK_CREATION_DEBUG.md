# AI Task Creation Debugging Guide

## Test Steps

1. **Open Mobile Tasks View** (`/tasks`)
2. **Open Browser Console** (Press F12, go to Console tab)
3. **Click the Purple AI Button** (bottom-left corner with sparkle icon)
4. **Type in AI Chat**: "הוסף משימה לקנות קפה"
5. **Press Send**

## Expected Console Output

You should see logs in this order:

```
🔧 Processing tool: add_task with params: {taskText: "לקנות קפה"}
🔧 handleAddTask called with params: {taskText: "לקנות קפה"}
📝 Task text to add: לקנות קפה
📦 Importing todoTaskService...
🔍 Parsing task text...
✅ Parsed task: {rawText: "לקנות קפה", segments: [...], tags: [...]}
🏗️ Creating todo...
✅ Created todo: {id: "...", rawText: "לקנות קפה", ...}
💾 Saving to Firestore...
✅ Successfully saved to Firestore!
🔧 Tool result: {success: true, message: "✅ Added new task: ...", data: {...}}
```

## Common Issues

### Issue 1: AI doesn't call the tool
**Symptoms**: No `🔧 Processing tool:` message
**Possible causes**:
- AI model not configured properly
- AI doesn't understand Hebrew request
- Tool not available in CALENDAR_TOOLS

**Solution**: Try English: "Add task to buy coffee"

### Issue 2: Tool is called but fails
**Symptoms**: See `🔧 Processing tool:` but then `❌ Error`
**Check**: The error message after `❌`

### Issue 3: Task saved but not visible
**Symptoms**: See `✅ Successfully saved to Firestore!` but task not in list
**Check**: 
- Real-time subscription logs: Look for `✅ Real-time update:`
- User auth: Check if `user.uid` and `user.familyId` are set

## Debug Commands

Run these in console to check system state:

```javascript
// Check if todoTaskService is initialized
console.log('User:', window.user);

// Check Firestore connection
console.log('Firebase app:', window.firebase);

// Check tasks
console.log('Current tasks:', window.tasks);
```

## What to Share

Please copy and paste from console:
1. All messages starting with `🔧`, `📝`, `✅`, or `❌`
2. Any red error messages
3. The AI's text response in the chat

This will help identify exactly where the process breaks.