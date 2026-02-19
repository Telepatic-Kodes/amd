# Mobile UX Improvements

**Fecha:** 2026-02-19
**Status:** Aprobado
**Alcance:** Críticos + High priority (9 fixes)
**Nivel de cambio:** Conservador — responsive CSS + layout condicional

---

## Contexto

Auditoría mobile encontró 41 issues (2 críticos, 7 high, 19 medium, 4 low). Lo que ya funciona bien: MobileNav bottom bar (44px touch targets), dashboard grid stacking, filtros content, accordion agentes. Los problemas principales son layouts fijos que no escalan a pantallas <768px.

---

## Fix 1 (Crítico): ContentFullscreen sidebar → horizontal tabs en mobile

**Archivo:** `components/content/ContentFullscreen.tsx`

**Antes:** Sidebar fija 220px + contenido. En 375px = 155px de espacio útil.

**Después:**
- Mobile (<md): tabs horizontales scrollables en la parte superior del área de contenido
- Desktop (md+): sidebar 220px como está actualmente
- Implementación: `hidden md:block` en sidebar, nuevo `md:hidden` tab bar horizontal

---

## Fix 2 (Crítico): Drawer width fullscreen en mobile

**Archivo:** `components/ui/Drawer.tsx`

**Antes:** `max-w-sm/md/lg` excede pantallas 320-375px.

**Después:**
- Width classes cambian a: `sm: "md:max-w-sm"`, `md: "md:max-w-md"`, `lg: "md:max-w-lg"`
- Mobile siempre `w-full` (ya tiene `w-full`, solo eliminar max-width constraint en <md)

---

## Fix 3 (High): WorkflowStepper visible en mobile

**Archivo:** `components/content/ContentFullscreen.tsx`

**Antes:** `hidden md:flex` — stepper invisible en mobile.

**Después:** Stepper siempre visible. En mobile, pasos muestran solo iniciales (D/R/A/P) y el step actual muestra nombre completo. Ajustar `hidden md:flex` → `flex` con responsive sizing.

---

## Fix 4 (High): Sidebar overlay más angosto

**Archivo:** `components/layout/LayoutShell.tsx` o `Sidebar.tsx`

**Antes:** `w-72` (288px) fijo.

**Después:** `w-64 sm:w-72` (256px en xs, 288px en sm+).

---

## Fix 5 (High): Content grid breakpoint

**Archivo:** `app/(dashboard)/content/page.tsx`

**Antes:** `md:grid-cols-2 lg:grid-cols-3`

**Después:** `sm:grid-cols-2 lg:grid-cols-3` — 2 columnas desde 640px.

---

## Fix 6 (High): Content header stacking

**Archivo:** `app/(dashboard)/content/page.tsx`

**Antes:** Título y "Generar Contenido" en mismo flex row.

**Después:** `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`

---

## Fix 7 (High): Agents header stacking

**Archivo:** `app/(dashboard)/agents/page.tsx`

**Antes:** Header no stacks en mobile.

**Después:** `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`

---

## Fix 8 (High): Editor textarea responsive

**Archivo:** `components/content/ContentFullscreen.tsx`

**Antes:** `min-h-[400px]` fijo.

**Después:** `min-h-[200px] md:min-h-[400px]`

---

## Fix 9 (High): SEO tab responsive

**Archivo:** `components/content/ContentFullscreen.tsx`

**Antes:** `max-w-xl` fijo.

**Después:** `max-w-full md:max-w-xl`
