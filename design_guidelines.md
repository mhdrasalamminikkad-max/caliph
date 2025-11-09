# Caliph Attendance - Design Guidelines

## Design Approach
**Hybrid System**: Material Design foundation adapted with Islamic cultural aesthetics for an elegant, mobile-first attendance tracking experience. The design balances functional efficiency with cultural reverence, creating a warm and welcoming interface for daily prayer attendance tracking.

## Core Design Principles
1. **Mobile-First Touch Optimization**: Every interaction designed for phone usage with generous tap targets
2. **Islamic Elegance**: Subtle geometric patterns, clean typography, and warm visual treatment
3. **Clarity & Speed**: Teachers should mark attendance in seconds, not minutes
4. **Respectful Hierarchy**: Prayer names and student lists presented with appropriate reverence

---

## Typography System

### Font Families
- **Primary**: Cairo (Arabic-style, modern, excellent readability)
- **Secondary**: Poppins (for data/numbers when needed)
- Load via Google Fonts CDN

### Hierarchy
- **Page Titles**: Cairo Bold, text-3xl (mobile) / text-4xl (desktop)
- **Prayer Names**: Cairo SemiBold, text-2xl with letter-spacing for elegance
- **Section Headers**: Cairo SemiBold, text-xl
- **Student Names**: Cairo Regular, text-lg for easy scanning
- **Body Text**: Cairo Regular, text-base
- **Helper Text**: Cairo Regular, text-sm with reduced opacity
- **Data/Numbers**: Poppins Medium, text-base (attendance counts, dates)

---

## Layout System

### Spacing Primitives
Use Tailwind units: **4, 6, 8, 12, 16** for consistency
- Component padding: p-6 (mobile), p-8 (desktop)
- Section spacing: space-y-8 or gap-8
- Tight groupings: space-y-4
- Button spacing: px-8 py-4 (minimum 44px height)

### Grid & Containers
- **Max Container Width**: max-w-4xl (optimized for mobile-first viewing)
- **Prayer Buttons Grid**: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- **Student List**: Single column with ample vertical rhythm
- **Summary Cards**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

### Viewport Strategy
- **Home Screen**: Natural height with centered content, gentle top padding (pt-12)
- **Student Lists**: Scrollable with sticky header for class/prayer context
- **Summaries**: Card-based layout with natural stacking

---

## Component Library

### Home/Splash Screen
**Logo Treatment**:
- Centered Caliph logo at top (w-32 h-32 on mobile, w-40 h-40 on desktop)
- Subtle shadow or glow effect for depth
- Generous spacing below (mb-12)

**Prayer Buttons** (Primary CTAs):
- Large touch targets: min-h-[88px] on mobile
- Rounded corners (rounded-2xl for softness)
- Prayer name in Cairo SemiBold
- Small prayer time indicator below name (text-sm, reduced opacity)
- Icon integration: Prayer-specific icon from Material Icons (mosque, sun, moon)
- Subtle pattern overlay for Islamic aesthetic
- Grid layout with gap-4 for comfortable spacing

**Navigation**: 
- Floating bottom nav or top app bar
- Summary icon/button always accessible

### Class Selection Screen
**Header**:
- Selected prayer name prominent (text-2xl, Cairo SemiBold)
- Back button (top-left, large tap target)
- Current date display (text-sm, Cairo Regular)

**Class Cards**:
- Card-based layout (p-6, rounded-xl)
- Class name + student count
- Subtle elevation (shadow-md)
- Last attendance indicator (e.g., "✓ Marked today")
- Full-width cards on mobile, 2-col on tablet+

### Student Attendance List
**Sticky Header**:
- Prayer + Class name
- Date
- Quick stats (e.g., "12/15 present")
- Back navigation

**Student Rows**:
- Clear separation (border-b with subtle treatment)
- Large touch-friendly rows (min-h-[72px])
- Student name (text-lg, Cairo Regular)
- Status buttons side-by-side:
  - Present (✓): Primary action, larger
  - Absent (✗): Secondary destructive action
- Reason field appears inline when marked absent
- Auto-save indicator (subtle checkmark animation)

**Reason Input**:
- Appears smoothly below student row when absent marked
- Textarea with placeholder: "Optional reason..."
- Compact but usable (h-20)
- Save automatically on blur

### Summary Views

**Daily Summary**:
- Date picker at top (calendar icon + readable date)
- Prayer-by-prayer breakdown
- Expandable class cards showing:
  - Class name
  - Attendance fraction (e.g., 12/15)
  - Visual progress indicator
  - Tap to see student details

**Weekly/Monthly Calendar View**:
- Calendar grid with attendance indicators
- Color-coded dots for prayer attendance levels
- Tap date to see full breakdown
- Filter by class or prayer

**Individual Student View**:
- Student name header (text-2xl)
- Avatar placeholder (initials in circle)
- Stats cards showing:
  - Total attendance rate
  - Prayer-wise breakdown
  - Recent attendance streak
- Scrollable history timeline with dates and prayers

---

## Navigation Patterns

### Primary Navigation
**Bottom Tab Bar** (mobile-optimized):
- Home (prayers)
- Daily Summary
- Reports
- Settings/Profile
- Active state with indicator and icon color shift
- Fixed positioning with backdrop blur
- Height: h-16 with centered content

### Secondary Navigation
- **Back buttons**: Always top-left with chevron icon
- **Breadcrumbs**: Prayer > Class > Students (top of screen, text-sm)

---

## Interaction Patterns

### Buttons
**Prayer Selection (Primary)**:
- Filled style with subtle shadow
- Large padding (px-8 py-6)
- Icon + text layout
- Tap feedback with scale transform (active:scale-95)

**Attendance Marking**:
- Present: Filled primary button, checkmark icon
- Absent: Outlined destructive button, X icon
- Toggle state clearly visible
- Instant visual feedback

**Navigation**:
- Ghost style for secondary actions
- Icon buttons for back/close (48x48 minimum)

### Forms
**Reason Input**:
- Minimal border treatment
- Focus state with subtle outline
- Placeholder text with appropriate opacity
- Auto-grow textarea

**Date Pickers**:
- Native mobile date picker
- Clear button integration
- Readable format display

### Feedback & Status
- **Success**: Subtle checkmark animation on save
- **Loading**: Spinner for data fetching (prayer-themed icon)
- **Empty States**: Friendly messages with relevant icons
  - "No students marked today"
  - "Start marking attendance for [Prayer]"

---

## Special Considerations

### Islamic Aesthetic Elements
- **Patterns**: Subtle geometric Islamic patterns as background texture (10% opacity max)
- **Dividers**: Use decorative geometric shapes sparingly between major sections
- **Prayer Times**: Display with respect (icon + time format)
- **Crescent/Star**: Use tastefully in logo and occasional accents

### Touch Optimization
- **Minimum tap targets**: 44x44px (iOS) / 48x48px (Material)
- **Spacing between tappable elements**: minimum 8px
- **Swipe gestures**: Consider swipe-to-mark on student rows
- **Long-press**: Quick actions menu for advanced options

### Performance
- **Skeleton screens**: Show placeholder content while loading
- **Lazy loading**: Student lists load incrementally if large
- **Optimistic UI**: Show changes immediately, sync in background

---

## Images & Assets

### Logo
- **Caliph logo**: Centered on home screen
- Transparent background
- High resolution for retina displays
- Optional: Animated entrance (fade in + subtle scale)

### Icons
- **Library**: Material Icons (CDN)
- **Prayer icons**: mosque, wb_sunny (Fajr/Dhuhr), brightness_3 (Maghrib/Isha), access_time (Asr)
- **UI icons**: check_circle, cancel, calendar_today, person, assessment, settings
- **Size**: 24px standard, 32px for primary actions

### Illustrations (Optional Enhancement)
- **Empty states**: Simple line illustrations for "no data" scenarios
- **Success states**: Subtle celebration icon when full class attendance marked

---

This design creates a respectful, efficient, and culturally appropriate attendance tracking system that teachers can use confidently during busy prayer times while maintaining the elegance befitting an Islamic educational institution.