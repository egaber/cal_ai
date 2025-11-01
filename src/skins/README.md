# Skin System Documentation

This directory contains a centralized color theming system (skin system) for the application. All colors are defined in one place, making it easy to maintain consistent theming and support multiple color schemes (light/dark mode).

## 🎨 Structure

```
src/skins/
├── types.ts           # TypeScript type definitions
├── lightSkin.ts       # Light theme colors
├── darkSkin.ts        # Dark theme colors
├── SkinContext.tsx    # React Context and hooks
├── index.ts           # Main exports
└── README.md          # This file
```

## 📦 Usage

### 1. Wrap Your App with SkinProvider

In your main `App.tsx` or root component:

```tsx
import { SkinProvider } from '@/skins/SkinContext';

function App() {
  return (
    <SkinProvider defaultSkin="light">
      {/* Your app components */}
    </SkinProvider>
  );
}
```

### 2. Use Colors in Components

#### Method 1: Using Hooks (Recommended)

```tsx
import { useSkin, useCategoryColors, usePriorityColors } from '@/skins/SkinContext';

function MyComponent() {
  const { skin, toggleTheme } = useSkin();
  const categories = useCategoryColors();
  const priorities = usePriorityColors();
  
  return (
    <div style={{ backgroundColor: skin.semantic.background, color: skin.semantic.text }}>
      <div style={{ backgroundColor: categories.work }}>Work Event</div>
      <div style={{ backgroundColor: priorities.high.bg, color: priorities.high.text }}>
        High Priority
      </div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

#### Method 2: Direct Skin Access

```tsx
import { useSkin } from '@/skins/SkinContext';

function EventCard({ category }: { category: string }) {
  const { skin } = useSkin();
  
  return (
    <div style={{ 
      backgroundColor: skin.categories[category],
      color: skin.semantic.text 
    }}>
      Event Content
    </div>
  );
}
```

## 🎯 Available Hooks

### Core Hook
- `useSkin()` - Returns the full skin context with theme toggle

### Specialized Hooks
- `useSemanticColors()` - Background, text, border, etc.
- `useCategoryColors()` - Event category colors
- `usePriorityColors()` - Priority level colors (low/medium/high/critical)
- `useStatusColors()` - Status colors (success/warning/error/info)
- `useTimeBucketColors()` - Time-based colors (morning/afternoon/evening/night)
- `useDateBucketColors()` - Date-based colors (today/tomorrow/this week/etc.)

## 🎨 Color Categories

### 1. Semantic Colors
General UI colors that adapt to theme:
```tsx
const semantic = useSemanticColors();
// semantic.background, semantic.text, semantic.border, etc.
```

### 2. Category Colors
Event/task category colors:
```tsx
const categories = useCategoryColors();
// categories.work, categories.personal, categories.family, etc.
```

### 3. Priority Colors
Task/event priority colors with bg, text, and border:
```tsx
const priorities = usePriorityColors();
// priorities.low, priorities.medium, priorities.high, priorities.critical
// Each has: { bg: string, text: string, border: string }
```

### 4. Status Colors
System status colors (full color scales):
```tsx
const status = useStatusColors();
// status.success, status.warning, status.error, status.info
// Each has: { 50, 100, 200, ..., 900 }
```

### 5. Time-based Colors
Colors for different times of day:
```tsx
const timeBuckets = useTimeBucketColors();
// timeBuckets.morning, timeBuckets.afternoon, timeBuckets.evening, timeBuckets.night
```

### 6. Date-based Colors
Colors for date proximity:
```tsx
const dateBuckets = useDateBucketColors();
// dateBuckets.today, dateBuckets.tomorrow, dateBuckets.thisWeek, etc.
```

## 🔧 Adding New Colors

### 1. Update Types
Add your color category to `types.ts`:

```typescript
export interface MyNewColors {
  option1: string;
  option2: string;
}

export interface Skin {
  // ... existing properties
  myNewColors: MyNewColors;
}
```

### 2. Update Skins
Add values in both `lightSkin.ts` and `darkSkin.ts`:

```typescript
export const lightSkin: Skin = {
  // ... existing properties
  myNewColors: {
    option1: '#ff0000',
    option2: '#00ff00',
  },
};
```

### 3. Create Hook (Optional)
Add a hook in `SkinContext.tsx`:

```typescript
export const useMyNewColors = () => {
  const { skin } = useSkin();
  return skin.myNewColors;
};
```

## 💡 Best Practices

1. **Always use the skin system** - Don't hardcode colors in components
2. **Use semantic names** - Prefer `skin.semantic.background` over specific colors
3. **Test both themes** - Ensure components look good in light and dark mode
4. **Use appropriate hooks** - Use specialized hooks for better code organization
5. **Consider accessibility** - Ensure sufficient contrast between text and backgrounds

## 🌓 Theme Toggle

Toggle between light and dark themes:

```tsx
function ThemeToggle() {
  const { skinName, toggleTheme } = useSkin();
  
  return (
    <button onClick={toggleTheme}>
      {skinName === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

## 📱 Mobile Considerations

The skin system works seamlessly with mobile React components. Use inline styles or styled-components with the hook values:

```tsx
function MobileComponent() {
  const { skin } = useSkin();
  
  return (
    <View style={{ backgroundColor: skin.semantic.background }}>
      <Text style={{ color: skin.semantic.text }}>Hello</Text>
    </View>
  );
}
```

## 🎯 Migration Guide

To migrate existing hardcoded colors:

1. Find hardcoded colors: `#hex` values, `rgb()`, Tailwind classes like `bg-blue-500`
2. Determine the appropriate category (semantic, category, priority, etc.)
3. Replace with skin system:
   ```tsx
   // Before
   <div className="bg-blue-500 text-white">Work</div>
   
   // After
   const categories = useCategoryColors();
   const semantic = useSemanticColors();
   <div style={{ backgroundColor: categories.work, color: semantic.text }}>Work</div>
   ```

## 🔍 Example: Full Component

```tsx
import { useSkin, useCategoryColors, usePriorityColors } from '@/skins/SkinContext';

interface TaskCardProps {
  title: string;
  category: keyof ReturnType<typeof useCategoryColors>;
  priority: keyof ReturnType<typeof usePriorityColors>;
}

function TaskCard({ title, category, priority }: TaskCardProps) {
  const { skin } = useSkin();
  const categories = useCategoryColors();
  const priorities = usePriorityColors();
  
  return (
    <div 
      style={{ 
        backgroundColor: skin.semantic.background,
        border: `2px solid ${priorities[priority].border}`,
        borderRadius: '8px',
        padding: '16px'
      }}
    >
      <div 
        style={{ 
          backgroundColor: categories[category],
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        {category}
      </div>
      <h3 style={{ color: skin.semantic.text }}>{title}</h3>
      <div 
        style={{ 
          backgroundColor: priorities[priority].bg,
          color: priorities[priority].text,
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        {priority} priority
      </div>
    </div>
  );
}
```

## 🚀 Future Enhancements

Potential additions to the skin system:
- Additional theme variants (e.g., high contrast, colorblind-friendly)
- Custom theme builder
- Animation/transition colors
- Gradient definitions
- Shadow configurations
