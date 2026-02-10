---
status: testing
phase: 08-file-upload
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md
started: 2026-01-30T22:00:00Z
updated: 2026-01-30T22:00:00Z
---

## Current Test

number: 1
name: FileDropZone - Drag and Drop PDF
expected: |
  Navigate to /content. Click "Add Content" or "Importar" button.
  FileImportModal opens showing Step 1 (Upload).
  You see a large drop zone with text "Arrastra archivo aquí" (Drag file here) or "Haz clic para seleccionar" (Click to select).
  Drag a PDF file onto the zone. Zone highlights with pulsing border animation.
  Drop the file. Loading spinner appears showing "Cargando..." with file name and size.
  PDF parses (should take <3 seconds).
  Success checkmark appears briefly (auto-clears after 2 seconds).
awaiting: user response

## Tests

### 1. FileDropZone - Drag and Drop PDF
expected: Drag-drop zone accepts PDF, shows loading state, then success
result: [pending]

### 2. FileDropZone - Click to Upload DOCX
expected: Click zone to select file, DOCX file uploads and parses successfully
result: [pending]

### 3. FileDropZone - Click to Upload TXT
expected: Click zone to select TXT file, file uploads and parses successfully
result: [pending]

### 4. FileDropZone - File Size Validation
expected: Attempt to upload file >10MB. Zone shows error message "Archivo demasiado grande" (File too large) with red background. Retry button appears.
result: [pending]

### 5. FileDropZone - Invalid File Type
expected: Attempt to upload unsupported file (e.g., .jpg, .docm). Zone shows error "Tipo de archivo no soportado" (Unsupported file type). Retry button appears.
result: [pending]

### 6. FileImportModal - Step 1 to Step 2 Transition
expected: After successful file parse, modal automatically transitions to Step 2 (Preview). File metadata displayed: name, type, word count, reading time, size.
result: [pending]

### 7. FileImportModal - Preview Mode (Read-only)
expected: In Step 2, extracted content displayed in EditorPreview (read-only). Cannot edit text directly. "Editar" (Edit) button visible and enabled.
result: [pending]

### 8. FileImportModal - Edit Mode Toggle
expected: Click "Editar" button. RichTextEditor replaces EditorPreview. Can now edit content, apply formatting (bold, italic, etc.). Button changes to indicate exit edit mode.
result: [pending]

### 9. FileImportModal - Title Editing
expected: Title field above content is editable. Default value is filename. Can clear and type new title. Title validation enforced (min 5 characters) before import enabled.
result: [pending]

### 10. FileImportModal - Validation Error
expected: Clear title field completely. Content validation error shows "Título requerido" (Title required). Import button disabled (greyed out).
result: [pending]

### 11. FileImportModal - Validation Passes
expected: Fill title (min 5 chars) and ensure body has content (min 50 chars). Error messages disappear. Import button becomes enabled (blue/active).
result: [pending]

### 12. FileImportModal - Import Button
expected: Click "Importar" (Import) button. Modal closes immediately. Success toast shows "Contenido importado" (Content imported).
result: [pending]

### 13. EditContentModal - Import Integration
expected: Open EditContentModal (edit existing content). Header shows "Importar archivo" (Import File) button next to close button. Click it. FileImportModal opens.
result: [pending]

### 14. EditContentModal - Auto-switch to Write Tab
expected: Complete import in FileImportModal. FileImportModal closes. EditContentModal shows imported content in write tab (not preview tab). Text is editable.
result: [pending]

### 15. UploadContentForm - Import Integration
expected: Click "Add Content" to open form. Header shows "Importar" (Import) button. Click it. FileImportModal opens.
result: [pending]

### 16. UploadContentForm - Auto-open After Import
expected: Complete import in FileImportModal. Form closes modal and automatically expands to show populated title and body fields. Content type dropdown visible for selection.
result: [pending]

### 17. End-to-End - Create Content from PDF
expected:
  1. Click "Add Content"
  2. Click "Importar"
  3. Upload PDF
  4. Preview and edit content
  5. Click "Importar"
  6. Form shows populated fields
  7. Select content type (e.g., "blog")
  8. Click "Create Content"
  Content successfully created and appears in grid with status "draft"
result: [pending]

### 18. End-to-End - Edit Content with DOCX Import
expected:
  1. Click "Edit" on existing content
  2. Click "Importar archivo"
  3. Upload DOCX
  4. Preview and edit
  5. Click "Importar"
  6. Content updates in EditContentModal
  7. Click "Save Changes"
  Content updates successfully, toast confirms
result: [pending]

### 19. Mobile Responsiveness - FileDropZone Touch Targets
expected: Test on mobile device (or browser inspector at 375px width). FileDropZone drag zone clickable area is at least 44x44px. Text and buttons readable. No horizontal scroll.
result: [pending]

### 20. Spanish Labels - Complete
expected: All UI text is in Spanish:
  - FileDropZone: "Arrastra archivo aquí", "Haz clic para seleccionar", "Cargando...", error messages
  - FileImportModal: Step labels, "Editar", "Importar"
  - EditContentModal: "Importar archivo" button
  - UploadContentForm: "Importar" button
result: [pending]

## Summary

total: 20
passed: 0
issues: 0
pending: 20
skipped: 0

## Gaps

[none yet]
