# Rich Text Editor - Manual Testing Checklist

## Pre-Testing Setup

1. Start the development server:
   ```bash
   cd ai-marketing-department/ai-marketing-department
   npm run dev
   ```

2. Open http://localhost:3000/content
3. Click "Add Content" or "Edit" on existing content
4. Open Browser DevTools (F12) → Console tab
5. Check for console errors or warnings

## Test Suite 1: Basic Formatting

### Text Formatting
- [ ] **Bold**: Select text, click Bold button (or Ctrl+B)
  - Expected: Text becomes bold
  - Verify: Toolbar button shows "pressed" state (indigo color)
  - Undo: Click Bold again to remove

- [ ] **Italic**: Select text, click Italic button (or Ctrl+I)
  - Expected: Text becomes italic
  - Verify: Toolbar button shows "pressed" state

- [ ] **Strikethrough**: Select text, click Strikethrough button
  - Expected: Text has line through it
  - Note: Hidden on mobile (<640px)

- [ ] **Inline Code**: Select text, click Code button (or Ctrl+E)
  - Expected: Text shown in monospace with background
  - Note: Hidden on mobile (<640px)

### Headings
- [ ] **H1**: Click Heading 1 button
  - Expected: Current line becomes large heading (2rem)
  - Verify: White color, bold font

- [ ] **H2**: Click Heading 2 button
  - Expected: Current line becomes medium heading (1.5rem)

- [ ] **H3**: Click Heading 3 button
  - Expected: Current line becomes small heading (1.25rem)

- [ ] **Note**: All headings hidden on mobile (<640px)

### Lists
- [ ] **Bullet List**: Click List button
  - Expected: Current line becomes bulleted item
  - Verify: Can add multiple items with Enter key
  - Verify: Tab indents, Shift+Tab outdents

- [ ] **Numbered List**: Click Numbered List button
  - Expected: Current line becomes numbered item
  - Verify: Numbers increment automatically

### Blocks
- [ ] **Blockquote**: Click Quote button
  - Expected: Current paragraph becomes quote with indigo left border
  - Verify: Italic gray text
  - Note: Hidden on mobile (<640px)

- [ ] **Code Block**: Click Code Block button
  - Expected: Current paragraph becomes code block
  - Verify: Dark background, monospace font
  - Note: Hidden on mobile (<640px)

- [ ] **Horizontal Rule**: Click HR button
  - Expected: Inserts horizontal line
  - Note: Hidden on mobile (<640px)

## Test Suite 2: Links

### Insert Link
- [ ] Select text, click Link button
  - Expected: LinkDialog opens
  - Verify: Dialog has focus on URL input

- [ ] Enter "example.com" (no protocol)
  - Click "Insert"
  - Expected: Adds "https://example.com" automatically
  - Verify: Text is underlined and indigo colored

### Edit Link
- [ ] Click on existing link text
  - Click Link button
  - Expected: LinkDialog opens with current URL
  - Verify: Dialog title says "Edit Link"

- [ ] Change URL to "google.com"
  - Click "Update"
  - Expected: Link updated
  - Verify: Clicking link shows new URL

### Remove Link
- [ ] Click on link text
  - Click Link button
  - Click "Remove" button
  - Expected: Link removed, text remains
  - Verify: Text no longer underlined

### Link Validation
- [ ] Enter empty URL
  - Click "Insert"
  - Expected: Error message "URL cannot be empty"
  - Verify: Red border on input

- [ ] Enter "mailto:test@example.com"
  - Click "Insert"
  - Expected: mailto: link created
  - Verify: Clicking opens email client

- [ ] Enter "tel:+1234567890"
  - Click "Insert"
  - Expected: tel: link created
  - Verify: Mobile devices can call number

### Keyboard Navigation
- [ ] Open LinkDialog
  - Press Enter key
  - Expected: Saves link and closes dialog

- [ ] Open LinkDialog
  - Press Escape key
  - Expected: Closes dialog without saving

## Test Suite 3: BubbleMenu

### Text Selection
- [ ] Select 2-3 words
  - Expected: BubbleMenu appears above selection
  - Verify: Shows Bold, Italic, Strikethrough, Code, Link buttons
  - Verify: Menu has dark background with border

### Formatting from BubbleMenu
- [ ] Select text, click Bold in BubbleMenu
  - Expected: Text becomes bold
  - Verify: BubbleMenu remains open
  - Verify: Bold button shows "pressed" state

- [ ] Click Link in BubbleMenu
  - Expected: Opens LinkDialog
  - Verify: Selection persists

### Mobile BubbleMenu
- [ ] Open Chrome DevTools (F12)
  - Click "Toggle device toolbar" (Ctrl+Shift+M)
  - Select "iPhone 12 Pro" or similar
  - Select text
  - Expected: BubbleMenu appears and doesn't cover selection
  - Verify: Menu positioned above or below selection
  - Verify: Menu stays within viewport

## Test Suite 4: Undo/Redo

### Basic Undo
- [ ] Type "Hello World"
  - Press Ctrl+Z
  - Expected: Text removed character by character
  - Verify: Can undo back to empty state

### Basic Redo
- [ ] After undo, press Ctrl+Y (or Ctrl+Shift+Z)
  - Expected: Text restored character by character
  - Verify: Can redo all undone changes

### Formatting Undo
- [ ] Type text, make it bold, then italic
  - Press Ctrl+Z
  - Expected: Removes italic first, then bold, then text
  - Verify: Each action undone separately

### Data Integrity
- [ ] Perform multiple edits (type, format, delete, insert)
  - Undo all changes
  - Redo all changes
  - Expected: No data corruption
  - Verify: Final state matches before undo

## Test Suite 5: Preview Mode

### Tab Switching
- [ ] Click "Preview" tab
  - Expected: Editor switches to preview mode
  - Verify: Tab has indigo background
  - Verify: Content shown formatted (read-only)

- [ ] Click "Write" tab
  - Expected: Editor switches back to edit mode
  - Verify: Can continue editing

### Preview Rendering
- [ ] Format text with bold, italic, headings, lists
  - Switch to Preview
  - Expected: All formatting preserved
  - Verify: Matches editor appearance
  - Verify: No edit controls visible

### Animation
- [ ] Switch between Write and Preview tabs
  - Expected: Smooth fade transition (150ms)
  - Verify: No flickering or layout shift

## Test Suite 6: Export Functions

### Copy HTML
- [ ] Create formatted content
  - Click "Copy HTML" button
  - Expected: Success toast notification
  - Verify: "Copied!" message appears

- [ ] Open text editor, paste (Ctrl+V)
  - Expected: HTML content pasted
  - Verify: Contains HTML tags (<p>, <strong>, etc.)

### Download File
- [ ] Create content with title "Test Article"
  - Click "Download" button
  - Expected: File downloads as "test-article-YYYY-MM-DD.html"
  - Verify: Success toast notification
  - Verify: File contains complete HTML

- [ ] Open downloaded file in browser
  - Expected: Content displays with formatting
  - Verify: All styles preserved

### Browser Compatibility
- [ ] Test Copy HTML in:
  - Chrome: ✅ Should work perfectly
  - Firefox: ✅ Should work perfectly
  - Safari: ⚠️ May require HTTPS, should fallback to plain text

- [ ] Test Download in:
  - Chrome: ✅ Should work perfectly
  - Firefox: ✅ Should work perfectly
  - Safari: ✅ Should work with timeout workaround

## Test Suite 7: Status Bar & Validation

### Character Count
- [ ] Type exactly 50 characters
  - Expected: Status bar shows "50 characters"
  - Verify: Formatted with thousands separator if > 999
  - Verify: Excludes HTML tags from count

### Word Count
- [ ] Type "Hello World Test"
  - Expected: Status bar shows "3 words"
  - Verify: Words separated by whitespace

### Reading Time
- [ ] Type 200 words
  - Expected: Status bar shows "1 min read"

- [ ] Type 1000 words
  - Expected: Status bar shows "5 min read"
  - Verify: Calculation: words / 200

### Validation States
- [ ] Start with empty editor
  - Expected: Red error indicator
  - Verify: Shows "Content cannot be empty"

- [ ] Type 30 characters
  - Expected: Red error indicator
  - Verify: Shows "Content must be at least 50 characters (currently 30)"

- [ ] Type 50+ characters
  - Expected: Green "Ready" indicator
  - Verify: Checkmark icon visible

- [ ] Type 90,000+ characters (90% of 100k limit)
  - Expected: Amber warning indicator
  - Verify: Shows "Approaching character limit: 90,000 / 100,000"

- [ ] Type 100,001+ characters
  - Expected: Red error indicator
  - Verify: Shows "Content exceeds maximum..."

## Test Suite 8: Edge Cases

### Empty Content
- [ ] Open editor with no content
  - Expected: Placeholder text visible
  - Verify: "Start writing..." or custom placeholder
  - Verify: Gray color, disappears on typing

### Very Long Words
- [ ] Type a 100-character word without spaces
  - Expected: Word wraps to next line
  - Verify: No horizontal scrolling
  - Verify: CSS word-break working

### Pasting Content

#### Paste with Images
- [ ] Copy content from Word/Google Docs with images
  - Paste into editor (Ctrl+V)
  - Expected: Warning toast notification
  - Verify: "Images removed" message
  - Verify: Only text content pasted

#### Paste with Formatting
- [ ] Copy styled content (colors, fonts, etc.)
  - Paste into editor
  - Expected: Formatting cleaned automatically
  - Verify: Only TipTap-supported formatting kept
  - Verify: No inline styles or classes

#### Paste Plain Text
- [ ] Copy plain text
  - Paste into editor
  - Expected: Text pasted normally
  - Verify: No errors

### Special Characters
- [ ] Type accented characters: é, ñ, ü, ç
  - Expected: Characters display correctly
  - Verify: Font rendering smooth

- [ ] Type emoji: 😀 🚀 ✨ 💡
  - Expected: Emoji display correctly
  - Verify: Count as characters in status bar

### Unicode
- [ ] Type Chinese characters: 你好世界
  - Expected: Characters display correctly

- [ ] Type Arabic: مرحبا
  - Expected: Characters display correctly
  - Verify: Right-to-left text handled

## Test Suite 9: Mobile Testing

### Chrome DevTools Emulation
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or "iPad Mini"

### Touch Targets
- [ ] Measure toolbar buttons
  - Expected: Minimum 44x44px
  - Verify: Easy to tap with finger

### Responsive Layout
- [ ] Resize to 320px width (iPhone SE)
  - Expected: Editor fits screen
  - Verify: No horizontal scrolling
  - Verify: Advanced buttons hidden

- [ ] Check visible buttons on mobile:
  - ✅ Bold
  - ✅ Italic
  - ✅ Bullet List
  - ✅ Numbered List
  - ✅ Link
  - ❌ Strikethrough (hidden)
  - ❌ Code (hidden)
  - ❌ Headings (hidden)
  - ❌ Blockquote (hidden)
  - ❌ Code Block (hidden)
  - ❌ Undo/Redo (hidden)

### Virtual Keyboard
- [ ] Focus on editor on mobile
  - Expected: Virtual keyboard appears
  - Verify: Editor doesn't scroll off screen
  - Verify: Can see cursor while typing

### BubbleMenu on Mobile
- [ ] Select text on mobile device
  - Expected: BubbleMenu appears
  - Verify: Doesn't cover selected text
  - Verify: Positioned within viewport
  - Verify: Easy to tap buttons (44x44px)

### LinkDialog on Mobile
- [ ] Click Link button on mobile
  - Expected: Dialog opens full-width
  - Verify: Input has sufficient space
  - Verify: Virtual keyboard doesn't cover input
  - Verify: Can tap Cancel/Insert buttons easily

## Test Suite 10: Performance

### Large Documents
1. Generate 10,000-word document (use Lorem Ipsum generator)
2. Paste into editor

- [ ] Typing latency
  - Expected: No noticeable delay
  - Verify: Characters appear instantly

- [ ] Scrolling performance
  - Expected: Smooth scrolling
  - Verify: No stuttering or jank

- [ ] Toolbar responsiveness
  - Click Bold, Italic, etc.
  - Expected: Immediate visual feedback
  - Verify: No delay in button state change

### Status Bar Updates
- [ ] Type continuously in large document
  - Expected: Status bar updates smoothly
  - Verify: Word count increments
  - Verify: No performance degradation

### Memory Leaks
1. Open DevTools → Performance → Memory
2. Click "Collect garbage"
3. Type 1000 characters
4. Delete all content
5. Click "Collect garbage" again

- [ ] Expected: Memory returns to baseline
- [ ] Verify: No retained objects

## Test Suite 11: Accessibility

### Screen Reader Testing (Optional)
If you have NVDA (Windows) or VoiceOver (Mac):

- [ ] Navigate toolbar with Tab key
  - Expected: Each button announced with label
  - Verify: "Bold button, toggle, not pressed"

- [ ] Activate Bold on selected text
  - Expected: "Bold button, toggle, pressed"

### Keyboard Navigation
- [ ] Press Tab from outside editor
  - Expected: Focus moves to first toolbar button
  - Verify: Visible focus indicator (blue outline)

- [ ] Continue pressing Tab
  - Expected: Focus moves through all buttons
  - Verify: Skips hidden buttons on mobile

- [ ] Press Shift+Tab
  - Expected: Focus moves backward
  - Verify: Correct reverse order

### ARIA Attributes
Open DevTools → Elements, inspect toolbar:

- [ ] Verify `role="toolbar"` on toolbar container
- [ ] Verify `aria-label="Text formatting toolbar"` on toolbar
- [ ] Verify each button has `aria-label`
- [ ] Verify toggle buttons have `aria-pressed="true"` when active
- [ ] Verify tabs have `role="tablist"` and `role="tab"`
- [ ] Verify tabs have `aria-selected="true"` when active

### Focus Management
- [ ] Open LinkDialog
  - Expected: Focus moves to URL input
  - Verify: Can close with Escape

- [ ] Close LinkDialog
  - Expected: Focus returns to editor
  - Verify: Can continue typing

## Test Suite 12: Integration Testing

### EditContentModal Integration
- [ ] Open /content page
  - Click "Edit" on content item
  - Expected: Modal opens with RichTextEditor
  - Verify: Content loads correctly

### Form Submission
- [ ] Edit content in modal
  - Click "Save Changes"
  - Expected: Content updates in database
  - Verify: Modal closes
  - Verify: Content list refreshes

### Tab Switching in Modal
- [ ] Switch between Write and Preview tabs
  - Click "Save Changes"
  - Expected: HTML content saved (not preview)
  - Verify: Reopening shows correct content

## Reporting Issues

### Issue Template
```
**Title**: [Brief description]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [Third step]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]

**Environment**:
- Browser: [Chrome/Firefox/Safari] [version]
- OS: [Windows/macOS/Linux]
- Screen size: [Desktop/Mobile]

**Console Errors**: [Paste any errors from console]

**Screenshots**: [If applicable]
```

## Test Results Summary

### Pass Criteria
- ✅ All basic formatting works
- ✅ Links can be inserted, edited, removed
- ✅ Undo/Redo doesn't corrupt data
- ✅ Export functions work
- ✅ Status bar accurate
- ✅ Edge cases handled gracefully
- ✅ Mobile experience smooth
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Accessibility requirements met

### Results Template
```
Tester: [Your name]
Date: [Test date]
Browser: [Browser and version]
OS: [Operating system]

Test Suite 1 (Basic Formatting): [PASS/FAIL]
Test Suite 2 (Links): [PASS/FAIL]
Test Suite 3 (BubbleMenu): [PASS/FAIL]
Test Suite 4 (Undo/Redo): [PASS/FAIL]
Test Suite 5 (Preview): [PASS/FAIL]
Test Suite 6 (Export): [PASS/FAIL]
Test Suite 7 (Status Bar): [PASS/FAIL]
Test Suite 8 (Edge Cases): [PASS/FAIL]
Test Suite 9 (Mobile): [PASS/FAIL]
Test Suite 10 (Performance): [PASS/FAIL]
Test Suite 11 (Accessibility): [PASS/FAIL]
Test Suite 12 (Integration): [PASS/FAIL]

Overall: [PASS/FAIL]

Notes:
[Additional observations or issues found]
```
