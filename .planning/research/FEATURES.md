# Feature Landscape: Production Readiness for AMD SaaS

**Domain:** Marketing SaaS (AI-powered content management) for non-technical Spanish-speaking users
**Researched:** 2026-02-09
**Context:** Subsequent milestone - making existing AMD system production-ready for paying customers
**Current State:** ~223,000 LOC, 37 AI agents, full feature set, deploying to Vercel
**Target:** Real paying clients in coming weeks

---

## Executive Summary

Production readiness is the critical gap between "works in development" and "ready for paying customers to trust with their money and business." For AMD—a sophisticated marketing SaaS with 37 AI agents targeting non-technical Spanish-speaking users—this means comprehensive error handling, polished loading states, graceful degradation, and enterprise-grade security hardening.

**Key insight from research:** **80% of users abandon within the first week** if they don't reach activation quickly, and **47% of users expect pages to load in under 2 seconds**. Production readiness is not about adding features—it's about defensive UX, graceful failure handling, and building trust through polish that becomes invisible when present but glaringly obvious when absent.

**Critical finding for AMD:** The gap between development and production isn't about functionality (AMD has 37 agents and full content workflows) but about **trust and reliability**. Every unhandled error, every blank loading screen, every confusing 500 error message erodes trust faster than features build it.

**Budget estimate:** 4-6 weeks for comprehensive production hardening if starting from working prototype.

---

## Table Stakes Features

Features users **expect** from a paid SaaS. Missing any of these makes the product feel unfinished, unprofessional, or untrustworthy. These are invisible when present, embarrassing when absent.

---

### 1. Comprehensive Error Handling

**Why expected:** Errors will happen (API failures, network issues, invalid inputs). How AMD handles them determines whether users trust the product or churn.

**Complexity:** Medium

**What's required:**

| Error Type | Current Gap | Required Implementation |
|-----------|-------------|------------------------|
| **API errors** | Raw error objects shown to users | Map all error types to Spanish user-friendly messages |
| **Network errors** | App crashes or hangs | Detect offline state, show retry option, queue actions |
| **Validation errors** | Generic "error" message | Inline, specific feedback ("El título debe tener al menos 5 caracteres") |
| **AI agent failures** | Task shows "failed" with no context | Explain why (rate limit, invalid input, service unavailable) |
| **Component crashes** | White screen of death | React Error Boundaries with recovery options |
| **Authentication errors** | Redirect loop | Clear session expired message with re-login CTA |

**Spanish-first consideration:** Error messages must be naturally translated, not machine-translated. Examples:
- ❌ "Error 500: Internal Server Error"
- ✅ "No pudimos completar esta acción. Por favor, intenta de nuevo en unos momentos."

**Implementation approach:**
```typescript
// Global error handler in Convex actions
try {
  const result = await callClaudeAPI(prompt);
  return { success: true, data: result };
} catch (error) {
  if (error.status === 429) {
    return {
      success: false,
      error: "Hemos alcanzado el límite de solicitudes. Intenta en 1 minuto."
    };
  }
  if (error.status === 500) {
    return {
      success: false,
      error: "Hubo un problema temporal. Nuestro equipo ya fue notificado."
    };
  }
  // Log to monitoring (Sentry)
  logError(error, { context: "claude-api" });
  return {
    success: false,
    error: "Algo salió mal. Por favor contacta a soporte si persiste."
  };
}
```

**Error boundaries for React:**
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    logErrorToSentry(error);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

**Sources:**
- [Error Message UX Best Practices](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback)
- [SaaS UX Design Guide 2026](https://www.designstudiouiux.com/blog/saas-ux-design-the-ultimate-guide/)
- [UX Guidelines for Error Handling](https://www.userjourneys.com/blog/ux-guidelines-for-error-handling/)

---

### 2. Professional Loading States

**Why expected:** AMD's AI agents can take 10-30 seconds to generate content. Users need to know the app is working, not frozen. Research shows **47% of users expect pages to load in under 2 seconds**.

**Complexity:** Low-Medium

**What's required:**

| Context | Current State | Required Implementation |
|---------|--------------|------------------------|
| **Page transitions** | Blank white screen | Skeleton screens matching final layout |
| **Agent execution** | Spinner with no context | Progress indicator with stage updates |
| **Content generation** | No feedback for 30s | Streaming progress ("Analizando brief...", "Generando contenido...", "Optimizando SEO...") |
| **Form submissions** | Button stays clickable | Disabled button with loading state |
| **Data fetching** | Empty space or spinner | Skeleton placeholders (cards, tables) |
| **Long operations** | Endless spinner | Estimated time remaining or progress bar |

**Why skeleton screens over spinners:** Research shows skeleton screens **reduce perceived wait time** by creating the illusion of progressive loading. Used by YouTube, Facebook, LinkedIn for this reason.

**Implementation for AMD:**
```typescript
// Agent execution with progress updates
<AgentExecutionModal>
  {status === "analyzing" && (
    <ProgressStep
      icon={<Search />}
      label="Analizando tu brief..."
      complete={false}
    />
  )}
  {status === "generating" && (
    <ProgressStep
      icon={<Sparkles />}
      label="Generando contenido con IA..."
      complete={false}
    />
  )}
  {status === "optimizing" && (
    <ProgressStep
      icon={<Target />}
      label="Optimizando para SEO..."
      complete={false}
    />
  )}
</AgentExecutionModal>

// Skeleton screens for content list
{isLoading ? (
  <div className="grid gap-4">
    {[1, 2, 3].map(i => (
      <Skeleton key={i} className="h-32 w-full" />
    ))}
  </div>
) : (
  <ContentList items={content} />
)}
```

**Package recommendation:** `react-loading-skeleton` for consistent placeholders

**Sources:**
- [Best Practices for Loading States in Next.js](https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs)
- [Skeleton Screens in React](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/)
- [React Loading Skeleton](https://www.npmjs.com/package/react-loading-skeleton)

---

### 3. Empty State Design

**Why expected:** Every user starts with zero content, zero agents executed, zero campaigns. **80% of users abandon if they don't reach activation within the first week.** Empty states guide users to their first success.

**Complexity:** Low-Medium

**What's required for AMD:**

| Page | Current State | Required Empty State |
|------|--------------|---------------------|
| `/content` (no content) | "No content found" text | Illustration + "Crea tu primer contenido" button + value proposition |
| `/agents` (no executions) | Empty list | "Los 37 agentes están listos" + quick-start guide + "Ejecutar primer agente" |
| `/campaigns` (no campaigns) | Blank page | "Crea tu primera campaña" + campaign wizard preview |
| `/analytics` (no data) | Empty charts | "Publica contenido para ver estadísticas" + sample dashboard preview |
| Agent execution history | "No tasks" | "Este agente aún no ha ejecutado tareas" + "Crear tarea" button |

**Design principles:**
1. **Visual appeal** - Illustration or icon, not just text
2. **Contextual guidance** - Tell users exactly what to do next
3. **Quick action** - Primary CTA to create first item
4. **Show value** - Preview what they'll see once they have data

**Example empty state component:**
```typescript
// components/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
      {secondaryAction && (
        <Link href={secondaryAction.href} className="mt-4">
          {secondaryAction.label}
        </Link>
      )}
    </div>
  );
}
```

**AMD-specific empty states:**
```typescript
// /content page with no content
<EmptyState
  icon={<FileText size={48} />}
  title="Aún no has creado contenido"
  description="Usa nuestros 37 agentes de IA para generar contenido profesional en segundos. Empieza con un post de LinkedIn o un artículo de blog."
  action={{
    label: "Crear primer contenido",
    onClick: () => setShowCreateModal(true)
  }}
  secondaryAction={{
    label: "Ver guía de inicio rápido",
    href: "/help/getting-started"
  }}
/>
```

**Sources:**
- [Empty State in SaaS Applications](https://userpilot.com/blog/empty-state-saas/)
- [Empty State UX Examples](https://www.pencilandpaper.io/articles/empty-states)
- [90 SaaS Empty State Examples 2026](https://www.saasframe.io/categories/empty-state)

---

### 4. Form Validation & Input Sanitization

**Why expected:** Security requirement and UX expectation. Prevents user mistakes, prevents malicious input, reduces support burden.

**Complexity:** Medium

**What's required for AMD:**

| Form | Current Validation | Required Validation |
|------|-------------------|---------------------|
| **Content creation** | Client-side only (title min 5, body min 50) | + Server-side validation, + XSS sanitization, + Length limits |
| **Agent task input** | No validation | + Input type validation, + Max length, + Required fields check |
| **Brand upload** | Basic file type check | + File size limits, + Format validation, + Sanitize filenames |
| **Team invitation** | Email format check | + Domain whitelist option, + Duplicate check, + Rate limiting |
| **Settings** | No validation | + URL format validation, + Token format checks |

**Security considerations for AMD:**
1. **XSS prevention** - Escape all user-generated content before rendering
2. **SQL injection** - Convex handles this, but validate input types
3. **Rate limiting** - Prevent abuse of AI agent endpoints (expensive)
4. **File uploads** - Validate file types, sizes, scan for malware

**Implementation approach:**
```typescript
// Zod schema for content validation (shared client + server)
import { z } from "zod";

export const contentSchema = z.object({
  type: z.enum(["blog", "social_linkedin", "social_twitter", ...]),
  title: z.string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  body: z.string()
    .min(50, "El contenido debe tener al menos 50 caracteres")
    .max(50000, "El contenido no puede exceder 50,000 caracteres"),
  metadata: z.object({
    targetKeywords: z.string().optional(),
    tone: z.enum(["professional", "casual", "friendly", "technical"]).optional(),
  }).optional(),
});

// Server-side validation in Convex mutation
export const createContent = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    body: v.string(),
    // ... other fields
  },
  handler: async (ctx, args) => {
    // Validate with Zod
    const result = contentSchema.safeParse(args);
    if (!result.success) {
      throw new ConvexError({
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR"
      });
    }

    // Sanitize HTML in body
    const sanitizedBody = sanitizeHtml(args.body, {
      allowedTags: ["p", "br", "strong", "em", "ul", "li"],
      allowedAttributes: {}
    });

    // Insert with sanitized data
    return await ctx.db.insert("content", {
      ...args,
      body: sanitizedBody,
    });
  },
});
```

**Rate limiting for agent execution:**
```typescript
// Convex action with rate limiting
export const executeAgent = action({
  args: { agentId: v.id("agents"), taskType: v.string(), input: v.any() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Check rate limit (10 agent executions per hour)
    const recentExecutions = await ctx.db
      .query("executions")
      .withIndex("by_user_created", q =>
        q.eq("userId", userId).gt("createdAt", Date.now() - 3600000)
      )
      .collect();

    if (recentExecutions.length >= 10) {
      throw new ConvexError({
        message: "Has alcanzado el límite de 10 ejecuciones por hora. Intenta en unos minutos.",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    // Execute agent...
  },
});
```

---

### 5. Toast Notifications & Feedback

**Why expected:** Users need immediate confirmation that actions succeeded or failed. Every action should have feedback.

**Complexity:** Low

**What's required for AMD:**

| Action | Current Feedback | Required Feedback |
|--------|------------------|-------------------|
| Content created | None | ✅ "Contenido creado exitosamente" (3s auto-dismiss) |
| Content published | None | ✅ "Contenido publicado en LinkedIn" (5s with undo) |
| Agent execution started | None | ℹ️ "Agente ejecutándose... esto puede tomar 30 segundos" |
| Agent execution failed | None | ❌ "El agente falló: [motivo]. Intenta de nuevo." (manual dismiss) |
| Settings saved | None | ✅ "Configuración guardada" |
| Team member invited | None | ✅ "Invitación enviada a [email]" |
| Error occurred | None | ❌ "Error: [mensaje específico]" (manual dismiss) |

**Best practices:**
- **Success toasts:** Auto-dismiss after 3-5 seconds
- **Error toasts:** Require manual dismiss (user reads error)
- **Info toasts:** Auto-dismiss after 5 seconds
- **Max 1 toast at a time:** Queue additional toasts
- **Include action buttons:** "Deshacer", "Ver detalles", "Reintentar"

**Implementation with `sonner`:**
```typescript
import { toast } from "sonner";

// Success
toast.success("Contenido creado exitosamente", {
  description: "Ya puedes verlo en la sección de Contenido",
  duration: 3000,
});

// Error with action
toast.error("No pudimos publicar en LinkedIn", {
  description: error.message,
  action: {
    label: "Reintentar",
    onClick: () => retryPublish(contentId),
  },
});

// Info with loading
const toastId = toast.loading("Generando contenido con IA...");
// ... wait for completion
toast.success("Contenido generado", { id: toastId });

// Warning before destructive action
toast.warning("¿Seguro que quieres eliminar este contenido?", {
  action: {
    label: "Eliminar",
    onClick: () => deleteContent(id),
  },
  cancel: {
    label: "Cancelar",
    onClick: () => {},
  },
});
```

---

### 6. Session Management & Timeouts

**Why expected:** Security requirement for production SaaS. **NIST recommends 30-minute inactivity timeout** to protect user data.

**Complexity:** Medium

**What's required:**

| Requirement | Implementation |
|------------|----------------|
| **Idle timeout** | 30 minutes of inactivity triggers warning |
| **Warning modal** | 2-minute warning before auto-logout |
| **Activity tracking** | Mouse, keyboard, scroll events reset timer |
| **Auto-save** | Save drafts before session expires |
| **Graceful logout** | Redirect to login with "Sesión expirada" message |
| **Remember location** | Redirect back after re-authentication |
| **Multi-tab sync** | Logout in one tab logs out all tabs |

**Implementation approach:**
```typescript
// hooks/useSessionTimeout.ts
export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before logout

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    setShowWarning(false);

    // Show warning 2 minutes before logout
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT - WARNING_TIME);

    // Logout after full timeout
    timeoutRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    resetTimeout(); // Initialize

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);

  return { showWarning, extendSession: resetTimeout };
}
```

**AMD-specific consideration:** Clerk handles authentication, but verify idle timeout is configured:
```typescript
// In Clerk settings, configure session timeout
// Or implement custom idle detection as shown above
```

**Sources:**
- [Secure Session Timeout Best Practices](https://ones.com/blog/implementing-secure-session-timeout-best-practices-code-examples/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST Session Guidelines](https://pages.nist.gov/800-63-4/sp800-63b/session/)

---

### 7. Performance Optimization

**Why expected:** **47% of users expect pages to load in under 2 seconds. 40% abandon after 3 seconds.** Every 100ms delay cuts conversions by ~7%.

**Complexity:** Medium-High

**Current AMD performance unknowns:**
- Current Lighthouse scores
- Page load times (FCP, LCP, TTI)
- Bundle size
- API response times

**What's required:**

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| **First Contentful Paint** | <1.8s | Code splitting, font optimization, critical CSS |
| **Largest Contentful Paint** | <2.5s | Image optimization, lazy loading |
| **Time to Interactive** | <3.5s | Reduce JavaScript, defer non-critical |
| **Total Blocking Time** | <300ms | Split long tasks, use web workers |
| **Cumulative Layout Shift** | <0.1 | Fixed dimensions for images, no layout shifts |
| **Bundle size** | <200KB gzipped | Tree-shaking, code splitting, dynamic imports |

**Implementation for AMD:**
```typescript
// 1. Code splitting with dynamic imports
const AgentModal = dynamic(() => import("@/components/AgentModal"), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false, // Don't load on server if not needed
});

// 2. Image optimization
import Image from "next/image";
<Image
  src="/agents/cmo-avatar.png"
  alt="CMO Agent"
  width={64}
  height={64}
  loading="lazy"
  placeholder="blur"
/>

// 3. Font optimization (already using next/font)
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap" });

// 4. API response caching
export const getAgents = query({
  args: {},
  handler: async (ctx) => {
    // Convex automatically caches, but ensure efficient queries
    return await ctx.db.query("agents").collect();
  },
});

// 5. Reduce bundle size
// Check bundle analyzer
npm run analyze
// Remove unused dependencies
npm prune
```

**Performance monitoring:**
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Check bundle size
npx @next/bundle-analyzer
```

**Sources:**
- [SaaS Performance Benchmarking 2026](https://www.binadox.com/blog/saas-performance-benchmarking-industry-standards-for-speed-uptime-and-user-satisfaction/)
- [Website Load Time Statistics 2026](https://www.hostinger.com/tutorials/website-load-time-statistics)
- [Page Load Speed for SaaS Success](https://www.getmonetizely.com/articles/why-page-load-speed-matters-for-saas-success-measurement-impact-and-optimization)

---

### 8. Mobile Responsiveness (Verification)

**Why expected:** 50%+ of traffic is mobile. Responsive design is table stakes in 2026.

**Complexity:** Low (AMD already has responsive design, just verify)

**Verification checklist:**

| Component | Status | Fix If Broken |
|-----------|--------|---------------|
| Dashboard cards stack on mobile | ✅ TBD | `flex-col md:flex-row` |
| Modals fit in viewport | ✅ TBD | `max-h-screen overflow-y-auto` |
| Forms usable with touch keyboards | ✅ TBD | `type="email"`, `inputMode="numeric"` |
| Navigation accessible | ✅ TBD | Mobile menu with hamburger |
| Tables don't break layout | ✅ TBD | Horizontal scroll or card view on mobile |
| Touch targets 44x44px minimum | ✅ TBD | Increase button padding |
| No horizontal scrolling | ✅ TBD | `overflow-x-hidden`, responsive images |
| Text readable without zoom | ✅ TBD | `text-base` minimum on mobile |

**Test on:**
- iPhone SE (375x667) - smallest modern iPhone
- iPhone 14 Pro (393x852) - standard
- iPad (768x1024) - tablet
- Android (360x640) - common Android size

---

### 9. Accessibility Compliance (WCAG 2.2 AA)

**Why expected:** Legal requirement in EU (since June 2025), U.S. public sector (April 2026). Ethical requirement for all users. Enterprise customers often require WCAG compliance.

**Complexity:** Medium-High

**What's required:**

| Requirement | Implementation | Verification |
|-------------|---------------|--------------|
| **Keyboard navigation** | All interactive elements accessible via Tab, Enter, Escape | Manual testing |
| **Screen reader support** | Semantic HTML, ARIA labels | Test with NVDA, JAWS, VoiceOver |
| **Color contrast** | 4.5:1 for normal text, 3:1 for large text | Automated tools (axe-core) |
| **Focus indicators** | Visible focus states on all interactive elements | Manual verification |
| **Alt text** | Descriptive alt text for all images | Code review |
| **Form labels** | Proper `<label>` associations for all inputs | Automated tools |
| **Error identification** | Errors announced to screen readers | Test with screen reader |
| **Heading hierarchy** | Proper h1-h6 structure (no skipping levels) | Automated tools |

**AMD-specific accessibility concerns:**
1. **Agent execution modals** - Announce progress to screen readers
2. **Content status badges** - Use aria-label ("Estado: Borrador")
3. **Chart visualizations** - Provide data table alternative
4. **Real-time updates** - Announce new notifications with aria-live
5. **Dynamic content** - Use aria-live regions for toast notifications

**Implementation approach:**
```typescript
// Add aria labels to interactive elements
<Button
  onClick={executeAgent}
  aria-label={`Ejecutar agente ${agent.name}`}
  aria-describedby="agent-description"
>
  Ejecutar
</Button>

// Semantic HTML
<nav aria-label="Navegación principal">
  <ul>
    <li><Link href="/dashboard">Dashboard</Link></li>
    <li><Link href="/agents">Agentes</Link></li>
  </ul>
</nav>

// Screen reader announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {status === "running" && "Agente ejecutándose, por favor espera"}
  {status === "completed" && "Agente completado exitosamente"}
</div>

// Form labels
<Label htmlFor="content-title">Título del contenido</Label>
<Input
  id="content-title"
  aria-required="true"
  aria-invalid={errors.title ? "true" : "false"}
  aria-describedby={errors.title ? "title-error" : undefined}
/>
{errors.title && (
  <span id="title-error" role="alert" className="text-red-500">
    {errors.title}
  </span>
)}
```

**Testing tools:**
```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react

# Add to _app.tsx in development
if (process.env.NODE_ENV !== 'production') {
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);
}

# Manual testing
# 1. Tab through entire app (keyboard only)
# 2. Use screen reader (NVDA on Windows, VoiceOver on Mac)
# 3. Run Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

**Sources:**
- [WCAG 2.2 Level AA Requirements 2026](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/)
- [WCAG for SaaS Owners Complete Guide 2026](https://medium.com/@mhdrahman/wcag-for-saas-owners-the-complete-guide-to-web-accessibility-compliance-in-2026-8eb794a9bcfa)
- [SaaS Accessibility Legal Compliance](https://www.accessibility.works/blog/saas-cloud-software-ada-compliance-wcag-testing-auditing/)

---

### 10. Security Hardening

**Why expected:** Production SaaS handles sensitive business data (brand assets, content, API keys). Security breaches destroy trust and business.

**Complexity:** High

**What's required for AMD:**

| Security Layer | Current State | Required Implementation |
|----------------|--------------|------------------------|
| **HTTPS everywhere** | ✅ Vercel handles | Verify HSTS headers enabled |
| **Content Security Policy** | ❓ Unknown | CSP headers to prevent XSS |
| **Rate limiting** | ❓ Unknown | Prevent brute-force, DDoS, API abuse |
| **Input sanitization** | Partial | Escape all user content, validate types |
| **Environment variables** | ✅ .env.local | Verify no secrets in client bundle |
| **Dependency scanning** | ❓ Unknown | Regular `npm audit`, automated scanning |
| **API authentication** | ✅ Clerk | Verify JWT validation on all routes |
| **CORS configuration** | ❓ Unknown | Whitelist allowed origins |
| **SQL injection** | ✅ Convex handles | N/A (Convex is NoSQL) |
| **XSS prevention** | ❓ Unknown | Escape user content, CSP headers |

**Rate limiting recommendations for AMD:**
```typescript
// Convex rate limiting with Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 per hour
});

export const executeAgent = action({
  args: { agentId: v.id("agents"), input: v.any() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Check rate limit
    const { success } = await ratelimit.limit(userId);
    if (!success) {
      throw new ConvexError({
        message: "Has alcanzado el límite de ejecuciones por hora",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    // Execute agent...
  },
});
```

**Content Security Policy:**
```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' *.convex.cloud *.anthropic.com;
  frame-ancestors 'none';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ''),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

**Dependency scanning:**
```bash
# Regular audits
npm audit
npm audit fix

# Automated scanning (GitHub Actions)
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm audit --audit-level=moderate
```

**Sources:**
- [SaaS Security Best Practices 2026](https://www.nudgesecurity.com/post/saas-security-best-practices)
- [9 SaaS Security Best Practices Checklist](https://www.reco.ai/learn/saas-security-best-practices)
- [State of SaaS Security 2025-2026](https://cloudsecurityalliance.org/artifacts/state-of-saas-security-report-2025)

---

### 11. Production Monitoring & Error Tracking

**Why expected:** You can't fix what you can't see. Production issues must be detected and resolved before users complain in reviews or churn.

**Complexity:** Medium

**What's required for AMD:**

| Monitoring Type | Tool | What to Track |
|----------------|------|---------------|
| **Error tracking** | Sentry | Unhandled exceptions, API errors, agent failures |
| **Performance monitoring** | Vercel Analytics | Core Web Vitals, page load times, API latency |
| **Uptime monitoring** | Better Uptime or UptimeRobot | External availability check |
| **User analytics** | PostHog or Mixpanel | Feature usage, onboarding completion, churn signals |
| **AI agent analytics** | Custom (Convex) | Agent execution success rate, tokens used, costs |

**Sentry implementation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0, // 100% of transactions for performance monitoring

  // Track agent execution as custom transactions
  beforeSend(event, hint) {
    // Add custom context for AMD
    if (event.contexts?.agent) {
      event.tags = {
        ...event.tags,
        agentId: event.contexts.agent.agentId,
        department: event.contexts.agent.department,
      };
    }
    return event;
  },
});
```

**Alerting thresholds for AMD:**
```typescript
// Alert configurations in Sentry
{
  "error_rate": {
    threshold: "1%", // Alert if >1% of requests error
    action: "Slack notification + email to dev team"
  },
  "agent_failure_rate": {
    threshold: "5%", // Alert if >5% of agent executions fail
    action: "Slack notification"
  },
  "page_load_time": {
    threshold: "3s", // Alert if p95 >3 seconds
    action: "Email to dev team"
  },
  "api_latency": {
    threshold: "500ms", // Alert if API p95 >500ms
    action: "Slack notification"
  },
  "downtime": {
    threshold: "1min", // Alert if down for >1 minute
    action: "PagerDuty page + SMS to on-call"
  }
}
```

**Custom agent analytics dashboard:**
```typescript
// Track agent execution metrics in Convex
export const trackAgentExecution = internalMutation({
  args: {
    agentId: v.id("agents"),
    executionId: v.id("executions"),
    status: v.string(),
    tokensUsed: v.number(),
    cost: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agent_metrics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Query for analytics dashboard
export const getAgentMetrics = query({
  args: { timeframe: v.string() },
  handler: async (ctx, args) => {
    const startTime = getStartTime(args.timeframe);
    const metrics = await ctx.db
      .query("agent_metrics")
      .filter(q => q.gte(q.field("timestamp"), startTime))
      .collect();

    return {
      totalExecutions: metrics.length,
      successRate: metrics.filter(m => m.status === "completed").length / metrics.length,
      avgDuration: average(metrics.map(m => m.durationMs)),
      totalCost: sum(metrics.map(m => m.cost)),
      totalTokens: sum(metrics.map(m => m.tokensUsed)),
    };
  },
});
```

**Sources:**
- [Top 10 SaaS Monitoring Tools 2026](https://themantrix.com/en/blog/Top-10-Tools-for-Monitoring-SaaS-Availability-and-Uptime-in-2026)
- [SaaS Monitoring Best Practices](https://www.dotcom-monitor.com/blog/saas-monitoring-best-practices/)
- [11 Best Error Tracking Tools 2026](https://betterstack.com/community/comparisons/error-tracking-tools/)

---

### 12. Audit Logging

**Why expected:** Enterprise customers **require** audit logs for compliance (SOC 2, GDPR). Many B2B buyers won't consider SaaS without it.

**Complexity:** Medium-High

**What's required for AMD:**

| Event Type | What to Log | Retention |
|-----------|-------------|-----------|
| **Authentication** | Login attempts (success/failed), logout, session expired | 1 year |
| **Content actions** | Created, edited, deleted, published, unpublished | 2 years |
| **Agent executions** | Agent ID, task type, input, result, tokens used | 1 year |
| **Team actions** | Member invited, removed, role changed | 2 years |
| **Settings changes** | API keys updated, model changed, rate limits modified | 2 years |
| **Brand data** | Brand uploaded, edited, deleted | 2 years |
| **Billing events** | Subscription created, upgraded, downgraded, cancelled | 7 years (legal req) |

**Implementation in Convex:**
```typescript
// schema.ts
defineTable("audit_logs")
  .index("by_user_timestamp", ["userId", "timestamp"])
  .index("by_action", ["action"])
  .index("by_resource", ["resourceType", "resourceId"]),

// Audit log mutation
export const createAuditLog = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(), // "content.created", "agent.executed", "user.invited"
    resourceType: v.string(), // "content", "agent", "user"
    resourceId: v.string(),
    metadata: v.any(), // Additional context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Wrap actions with audit logging
export const createContent = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Create content
    const contentId = await ctx.db.insert("content", {
      ...args,
      createdBy: userId,
    });

    // Log action
    await ctx.runMutation(internal.auditLog.createAuditLog, {
      userId,
      action: "content.created",
      resourceType: "content",
      resourceId: contentId,
      metadata: { type: args.type, title: args.title },
    });

    return contentId;
  },
});
```

**Audit log UI:**
```typescript
// /settings/audit-logs page
export default function AuditLogsPage() {
  const logs = useQuery(api.auditLog.listAuditLogs, {
    filters: { /* ... */ }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs?.map(log => (
          <TableRow key={log._id}>
            <TableCell>{formatDate(log.timestamp)}</TableCell>
            <TableCell>{log.userName}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell>{log.resourceType}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                Ver detalles
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Export functionality (GDPR requirement):**
```typescript
export const exportAuditLogs = action({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.runQuery(internal.auditLog.getLogsForUser, args);

    // Convert to CSV
    const csv = convertToCSV(logs);

    // Upload to secure storage (S3 or similar)
    const downloadUrl = await uploadFile(csv, `audit-logs-${args.userId}.csv`);

    // Send email with download link
    await sendEmail({
      to: user.email,
      subject: "Tus registros de auditoría",
      body: `Descarga tus registros aquí: ${downloadUrl} (expira en 7 días)`,
    });

    return { success: true };
  },
});
```

**Sources:**
- [Enterprise Ready Audit Logging](https://www.enterpriseready.io/features/audit-log/)
- [Audit Logs for SaaS Enterprise Customers](https://frontegg.com/blog/audit-logs-for-saas-enterprise-customers)
- [SaaS Compliance Audit Trail](https://payproglobal.com/answers/what-is-saas-compliance-audit-trail/)

---

## Differentiators

Features that make AMD feel **polished and professional**. Not expected by all users, but significantly improve user perception, retention, and word-of-mouth. These are the "wow" moments that make users feel confident in their purchase decision.

---

### 1. Comprehensive Onboarding Flow

**Why valuable:** Research shows **75% of users abandon products within a week without clear onboarding**. Effective onboarding reduces churn by 50%+. For AMD with 37 agents, onboarding is critical to prevent overwhelm.

**Complexity:** Medium-High

**What's required for AMD:**

**Step 1: Welcome & Goal Selection**
```typescript
<OnboardingStep step={1}>
  <h2>¡Bienvenido a AMD!</h2>
  <p>Tu departamento de marketing con 37 agentes de IA</p>

  <h3>¿Qué quieres lograr primero?</h3>
  <GoalCards>
    <GoalCard
      icon={<Target />}
      title="Crear contenido profesional"
      description="Genera posts, artículos y campañas con IA"
      onClick={() => setGoal("content")}
    />
    <GoalCard
      icon={<TrendingUp />}
      title="Analizar mi audiencia"
      description="Descubre qué funciona mejor"
      onClick={() => setGoal("analytics")}
    />
    <GoalCard
      icon={<Users />}
      title="Gestionar mi equipo"
      description="Colabora con tu equipo de marketing"
      onClick={() => setGoal("team")}
    />
  </GoalCards>
</OnboardingStep>
```

**Step 2: Simplified Brand Setup**
```typescript
<OnboardingStep step={2}>
  <h2>Cuéntanos sobre tu marca</h2>
  <p>Esto ayuda a los agentes a crear contenido alineado con tu identidad</p>

  <Form>
    <Input
      label="Nombre de tu empresa"
      placeholder="ACME Corp"
    />
    <Textarea
      label="¿Qué hace tu empresa?"
      placeholder="Ayudamos a..."
      rows={3}
    />
    <Select
      label="Tono de tu marca"
      options={["Profesional", "Casual", "Amigable", "Técnico"]}
    />
    <Button>Siguiente</Button>
  </Form>

  <SkipLink onClick={skipToStep3}>
    Completar más tarde →
  </SkipLink>
</OnboardingStep>
```

**Step 3: First Content Creation (Interactive)**
```typescript
<OnboardingStep step={3}>
  <h2>Crea tu primer contenido</h2>
  <p>Vamos a crear un post de LinkedIn juntos</p>

  <InteractiveDemo>
    <AgentSelector
      selected="social-001"
      disabled
      hint="Este agente se especializa en LinkedIn"
    />

    <Input
      label="¿Sobre qué quieres escribir?"
      placeholder="Ej: Tendencias de IA en marketing"
      value={topic}
      onChange={setTopic}
    />

    <Button
      onClick={generateFirstContent}
      loading={isGenerating}
    >
      {isGenerating ? "Generando..." : "Generar contenido"}
    </Button>

    {content && (
      <ContentPreview content={content}>
        <SuccessMessage>
          ¡Perfecto! Así de fácil es crear contenido con AMD.
        </SuccessMessage>
      </ContentPreview>
    )}
  </InteractiveDemo>
</OnboardingStep>
```

**Step 4: Success Moment**
```typescript
<OnboardingStep step={4}>
  <SuccessAnimation>
    <Confetti />
    <CheckCircle size={64} className="text-green-500" />
  </SuccessAnimation>

  <h2>¡Listo! Ya puedes usar AMD</h2>
  <p>Has desbloqueado tu departamento de marketing con IA</p>

  <NextSteps>
    <NextStepCard
      title="Explora tus 37 agentes"
      description="Cada uno se especializa en una tarea de marketing"
      href="/agents"
    />
    <NextStepCard
      title="Crea una campaña"
      description="Coordina múltiples agentes para un objetivo"
      href="/campaigns"
    />
    <NextStepCard
      title="Invita a tu equipo"
      description="Colabora con colegas en AMD"
      href="/settings/team"
    />
  </NextSteps>

  <Button onClick={completeOnboarding}>
    Ir al Dashboard
  </Button>
</OnboardingStep>
```

**Progress tracking:**
```typescript
// Track onboarding completion
export const updateOnboardingProgress = mutation({
  args: {
    userId: v.id("users"),
    step: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      onboarding: {
        currentStep: args.step,
        completed: args.completed,
        completedAt: args.completed ? Date.now() : null,
      },
    });
  },
});

// Show onboarding modal on first login
useEffect(() => {
  if (user && !user.onboarding?.completed) {
    setShowOnboarding(true);
  }
}, [user]);
```

**Sources:**
- [SaaS Onboarding Best Practices 2026](https://www.sales-hacking.com/en/post/best-practices-onboarding-saas)
- [8 SaaS Companies Best Onboarding Experience](https://userpilot.com/blog/best-user-onboarding-experience/)
- [SaaS Onboarding UX Best Practices](https://cieden.com/saas-onboarding-best-practices-and-common-mistakes-ux-upgrade-article-digest)

---

### 2. Contextual In-App Help

**Why valuable:** Reduces support burden, empowers users to self-serve, improves satisfaction. Non-technical users need help understanding 37 agents.

**Complexity:** Medium

**What's required:**

| Help Type | Implementation | Example |
|-----------|---------------|---------|
| **Help widget** | Floating button (bottom-right) | Intercom, Crisp, or custom |
| **Contextual tooltips** | Hover/click on `?` icons | "Este agente se especializa en..." |
| **Video tutorials** | Short (<2 min) feature explainers | Loom embedded videos |
| **Search** | Cmd+K help search | "¿Cómo ejecuto un agente?" |
| **Changelog** | "What's new" modal | Show new features on login |
| **Agent descriptions** | Expanded info in agent cards | Full description + use cases |

**Implementation:**
```typescript
// components/HelpWidget.tsx
export function HelpWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full"
        onClick={() => setOpen(true)}
      >
        <HelpCircle />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <Tabs defaultValue="search">
            <TabsList>
              <TabsTrigger value="search">Buscar ayuda</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="guides">Guías</TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <Input
                placeholder="¿En qué necesitas ayuda?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <HelpSearchResults query={searchQuery} />
            </TabsContent>

            <TabsContent value="videos">
              <VideoLibrary />
            </TabsContent>

            <TabsContent value="guides">
              <GuidesList />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Contextual tooltips
import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="El Content Director coordina la producción editorial y asigna tareas a los escritores.">
  <HelpCircle className="h-4 w-4 text-muted-foreground" />
</Tooltip>
```

**Content to create:**
1. **Getting started guide** - "Primeros pasos con AMD"
2. **Agent tutorials** - One page per department explaining agents
3. **Content creation guide** - "Cómo crear tu primer contenido"
4. **Campaign setup** - "Cómo coordinar agentes en una campaña"
5. **Troubleshooting** - Common issues and solutions
6. **Video library** - 2-minute Loom videos for key features

**Sources:**
- [SaaS Help Documentation Best Practices 2026](https://devdocs.work/saas-software-documentation-services)
- [Top 10 Software Documentation Tools 2026](https://document360.com/blog/software-documentation-tools/)
- [Building SaaS Documentation Knowledge Base](https://cyclr.com/blog/building-a-saas-documentation-knowledge-base)

---

### 3. Smart Defaults & Personalization

**Why valuable:** Reduces cognitive load, makes product feel intuitive. AMD has many options—smart defaults prevent overwhelm.

**Complexity:** Low-Medium

**What's required:**

| Context | Smart Default | Personalization |
|---------|--------------|-----------------|
| **Agent execution** | Remember last agent used | Suggest agents based on content type |
| **Content tone** | Default to brand voice | Learn preferred tone over time |
| **Social platforms** | Default to LinkedIn (primary) | Remember last selected platforms |
| **Dashboard view** | Show most-used department | Customizable widget layout |
| **Language** | Spanish (AMD target) | Remember preference |
| **Theme** | Light mode | Dark/light toggle (remember) |
| **Notifications** | Weekly email digest | Customize frequency |

**Implementation:**
```typescript
// Store user preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      defaultAgent: v.optional(v.id("agents")),
      defaultTone: v.optional(v.string()),
      defaultPlatforms: v.optional(v.array(v.string())),
      theme: v.optional(v.string()),
      language: v.optional(v.string()),
      emailDigest: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      preferences: args.preferences,
    });
  },
});

// Use smart defaults in forms
const defaultAgent = user.preferences?.defaultAgent || "content-director";
const defaultTone = user.preferences?.defaultTone || brand.tone || "professional";
const defaultPlatforms = user.preferences?.defaultPlatforms || ["linkedin"];

<Select
  defaultValue={defaultAgent}
  onValueChange={value => {
    setSelectedAgent(value);
    // Remember for next time
    updatePreferences({ defaultAgent: value });
  }}
>
  {agents.map(agent => (
    <SelectItem key={agent._id} value={agent._id}>
      {agent.name}
    </SelectItem>
  ))}
</Select>
```

---

### 4. Keyboard Shortcuts & Power User Features

**Why valuable:** Makes power users efficient, builds product love and advocacy.

**Complexity:** Low-Medium

**What's required for AMD:**

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + K` | Command palette | Global |
| `N` | New content | /content page |
| `E` | Execute selected agent | /agents page |
| `S` | Save draft | Content editor |
| `?` | Show shortcuts help | Global |
| `/` | Focus search | Global |
| `Esc` | Close modal/dialog | Global |
| `Cmd/Ctrl + Enter` | Submit form | Forms |

**Implementation:**
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }

      // Show help
      if (e.key === "?") {
        e.preventDefault();
        showKeyboardShortcuts();
      }

      // Focus search
      if (e.key === "/") {
        e.preventDefault();
        focusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

// Command palette component
<CommandPalette>
  <CommandInput placeholder="Buscar acciones, agentes, páginas..." />
  <CommandList>
    <CommandGroup heading="Acciones rápidas">
      <CommandItem onSelect={createContent}>
        <FileText className="mr-2" />
        Crear contenido
      </CommandItem>
      <CommandItem onSelect={executeAgent}>
        <Zap className="mr-2" />
        Ejecutar agente
      </CommandItem>
    </CommandGroup>

    <CommandGroup heading="Navegación">
      <CommandItem onSelect={() => router.push("/dashboard")}>
        <Home className="mr-2" />
        Dashboard
      </CommandItem>
      <CommandItem onSelect={() => router.push("/agents")}>
        <Users className="mr-2" />
        Agentes
      </CommandItem>
    </CommandGroup>

    <CommandGroup heading="Búsqueda">
      {searchResults.map(result => (
        <CommandItem key={result.id} onSelect={() => open(result)}>
          {result.title}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandPalette>
```

---

### 5. Data Export & Portability (GDPR Compliance)

**Why valuable:** GDPR right to data portability (required for EU users). Builds trust—users own their data.

**Complexity:** Medium

**What's required:**

| Export Type | Format | Includes |
|-------------|--------|----------|
| **User data** | JSON | Profile, preferences, settings |
| **Content** | CSV + JSON | All posts, drafts, metadata |
| **Agent executions** | CSV | Execution history, results |
| **Analytics** | CSV | Engagement metrics over time |
| **Audit logs** | CSV | Activity history |
| **Brand assets** | ZIP | Logos, uploaded files |

**Implementation:**
```typescript
export const exportUserData = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Gather all user data
    const user = await ctx.runQuery(internal.users.getUser, { id: args.userId });
    const content = await ctx.runQuery(internal.content.listByUser, { userId: args.userId });
    const executions = await ctx.runQuery(internal.executions.listByUser, { userId: args.userId });
    const auditLogs = await ctx.runQuery(internal.auditLog.getLogsForUser, { userId: args.userId });

    // Create export package
    const exportData = {
      user: {
        profile: user,
        preferences: user.preferences,
        createdAt: user._creationTime,
      },
      content: content.map(c => ({
        id: c._id,
        type: c.type,
        title: c.title,
        body: c.body,
        createdAt: c._creationTime,
        status: c.status,
      })),
      executions: executions.map(e => ({
        agent: e.agentId,
        task: e.taskType,
        status: e.status,
        createdAt: e._creationTime,
      })),
      auditLogs: auditLogs,
    };

    // Upload to storage
    const downloadUrl = await uploadToS3(
      JSON.stringify(exportData, null, 2),
      `export-${args.userId}-${Date.now()}.json`
    );

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Tu exportación de datos de AMD",
      body: `
        Tu exportación está lista para descargar:
        ${downloadUrl}

        Este enlace expira en 7 días.
      `,
    });

    // Log export
    await ctx.runMutation(internal.auditLog.createAuditLog, {
      userId: args.userId,
      action: "data.exported",
      resourceType: "user",
      resourceId: args.userId,
      metadata: { format: "json", size: exportData.toString().length },
    });

    return { success: true };
  },
});

// UI for export
<Card>
  <CardHeader>
    <CardTitle>Exportar tus datos</CardTitle>
    <CardDescription>
      Descarga toda tu información de AMD (GDPR compliance)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button onClick={requestExport} loading={isExporting}>
      {isExporting ? "Preparando exportación..." : "Exportar mis datos"}
    </Button>
    <p className="text-sm text-muted-foreground mt-2">
      Recibirás un email con el enlace de descarga en unos minutos.
    </p>
  </CardContent>
</Card>
```

---

## Anti-Features

Features to **deliberately NOT build** for first production release. These are common mistakes, premature optimizations, or features that add complexity without proportional value for AMD's target market (non-technical Spanish-speaking users).

---

### 1. Real-Time Collaborative Editing (Google Docs Style)

**Why avoid:** High complexity (CRDT, operational transforms, WebSockets). AMD is not a document editor—content creation is solo, not simultaneous.

**What to do instead:**
- Show "who's editing" indicator
- Auto-save drafts every 30 seconds
- Prevent overwrites with "last saved" timestamps
- Simple lock: "Carlos está editando este contenido"

**When to reconsider:** When team plans (5+ concurrent users editing same content) become primary use case AND users explicitly request it.

---

### 2. Custom AI Model Selection

**Why avoid:** Non-technical users don't understand model differences (Sonnet vs Opus vs Haiku). Adds cognitive load without value.

**What to do instead:**
- Use Claude Sonnet 4 for all operations (balance of quality/speed/cost)
- Optimize prompts instead of exposing model choice
- Admin-only model override in settings (for cost optimization)

**When to reconsider:** When power users request specific models for specific use cases (e.g., Haiku for speed, Opus for quality).

---

### 3. White-Label / Custom Branding

**Why avoid:** Massive complexity for uncertain value. AMD's target is SMBs, not agencies reselling.

**What to do instead:**
- Strong AMD branding
- Focus on customizing content/voice within product
- Agency plan with co-branding (AMD + Agency logo)

**When to reconsider:** When multiple enterprise agencies (>$10K/year) request it as a blocker.

---

### 4. Multi-Language UI (Beyond Spanish/English)

**Why avoid:** Translation overhead for 37 agent descriptions, all UI text, error messages, help docs. Spanish-first is target market.

**What to do instead:**
- Perfect Spanish experience
- English for international expansion
- Other languages only after proven demand

**When to reconsider:** After 1000+ paying users request specific language, or entering new market (e.g., Brazil → Portuguese).

---

### 5. Native Mobile Apps (iOS/Android)

**Why avoid:** Huge development burden. AMD's 37-agent dashboard doesn't translate well to mobile anyway. Responsive web app is sufficient.

**What to do instead:**
- Perfect mobile web experience
- PWA for home screen install
- Mobile-optimized agent execution

**When to reconsider:** When mobile-specific features are critical (push notifications for agent completion, camera integration for brand assets) and can't be done with PWA.

---

### 6. Video Content Generation

**Why avoid:** AMD agents are text-focused. Video requires transcoding, storage, complex APIs. Scope creep.

**What to do instead:**
- Support video script generation (already have YouTube Scriptwriter agent)
- Allow video file uploads for content library
- Integrate with external video tools (Descript, Loom)

**When to reconsider:** When video becomes primary content type for majority of users (unlikely for B2B marketing).

---

### 7. Blockchain / Web3 Integration

**Why avoid:** Target market (non-technical marketers) doesn't care. Adds complexity without value.

**What to do instead:** Accept traditional payments (credit card via Stripe).

**When to reconsider:** Never, unless target market shifts to crypto-native audience.

---

### 8. Advanced Analytics (ML-Powered Predictions)

**Why avoid:** Requires significant data volume to be accurate. Early users won't have enough data for predictions to be meaningful.

**What to do instead:**
- Show clear, actionable analytics on what happened
- Basic trend lines (up/down arrows)
- AI-generated insights from existing data (not predictions)

**When to reconsider:** After 6+ months of user data, when patterns are clear and predictions would be valuable.

---

### 9. Custom Agent Builder (No-Code Agent Creation)

**Why avoid:** AMD's 37 agents are carefully designed. Custom agent creation requires prompt engineering skills (not target audience).

**What to do instead:**
- Perfect existing 37 agents
- Add new pre-built agents based on user feedback
- Allow agent configuration (tone, focus areas) not creation

**When to reconsider:** When advanced users specifically request custom agents AND have prompt engineering skills.

---

### 10. Self-Hosting Option

**Why avoid:** Support nightmare, security risk, reduces product value (cloud features won't work offline).

**What to do instead:** SaaS-only. Focus on making cloud experience fast, secure, reliable.

**When to reconsider:** When large enterprise customers with strict data residency requirements (rare for marketing tool) request it.

---

## Production Launch Roadmap

Based on research, here's the recommended phase structure for making AMD production-ready:

---

### Phase 1: Foundation (Week 1-2)

**Focus:** Error handling, validation, basic security

| Task | Priority | Effort |
|------|----------|--------|
| Global error handler (API, network, component) | P0 | 3 days |
| Spanish error messages dictionary | P0 | 1 day |
| React Error Boundaries | P0 | 1 day |
| Form validation (Zod schemas) | P0 | 2 days |
| Input sanitization (XSS prevention) | P0 | 1 day |
| Toast notification system (sonner) | P0 | 1 day |
| Session timeout detection | P1 | 2 days |

**Success metric:** Zero unhandled exceptions reaching users

---

### Phase 2: User Experience (Week 3)

**Focus:** Loading states, empty states, feedback

| Task | Priority | Effort |
|------|----------|--------|
| Skeleton screens for all pages | P0 | 2 days |
| Agent execution progress indicators | P0 | 2 days |
| Empty state designs for all pages | P0 | 2 days |
| Loading states for all buttons/forms | P1 | 1 day |

**Success metric:** No blank screens during loading, all actions have feedback

---

### Phase 3: Performance (Week 4)

**Focus:** Optimize load times, bundle size

| Task | Priority | Effort |
|------|----------|--------|
| Lighthouse audit baseline | P0 | 1 day |
| Code splitting (dynamic imports) | P0 | 2 days |
| Image optimization (Next.js Image) | P0 | 1 day |
| Bundle size analysis and reduction | P1 | 2 days |
| API response caching | P1 | 1 day |

**Success metric:** Lighthouse score >90, LCP <2.5s

---

### Phase 4: Security & Compliance (Week 5)

**Focus:** Hardening, monitoring, audit logs

| Task | Priority | Effort |
|------|----------|--------|
| Rate limiting (Upstash Redis) | P0 | 2 days |
| CSP headers | P0 | 1 day |
| Dependency audit and updates | P0 | 1 day |
| Sentry error tracking setup | P0 | 1 day |
| Audit log implementation | P1 | 2 days |
| Data export functionality (GDPR) | P1 | 2 days |

**Success metric:** No critical vulnerabilities, error tracking active

---

### Phase 5: Polish (Week 6)

**Focus:** Onboarding, help, accessibility

| Task | Priority | Effort |
|------|----------|--------|
| Onboarding flow (4 steps) | P0 | 3 days |
| Help widget with search | P1 | 2 days |
| Accessibility audit (WCAG) | P1 | 2 days |
| Keyboard shortcuts | P2 | 1 day |
| Mobile responsiveness verification | P1 | 1 day |

**Success metric:** >60% onboarding completion, WCAG 2.2 AA passing

---

### Phase 6: Pre-Launch Verification (Week 7)

**Focus:** Testing, monitoring, documentation

| Task | Priority | Effort |
|------|----------|--------|
| End-to-end testing (critical flows) | P0 | 2 days |
| Load testing (simulate 100 concurrent users) | P0 | 1 day |
| Monitoring dashboard setup | P0 | 1 day |
| Support documentation | P0 | 2 days |
| Launch checklist review | P0 | 1 day |

**Success metric:** All critical flows working, monitoring active, docs complete

---

## Success Metrics for Production Readiness

How to measure if production readiness efforts are working:

### Error Rates
- ✅ Error rate <0.5% of requests
- ✅ Zero unhandled exceptions reaching users
- ✅ Error recovery rate >80% (users can continue after error)
- ✅ Mean Time to Resolution (MTTR) <4 hours

### Performance
- ✅ Core Web Vitals passing (LCP <2.5s, FID <100ms, CLS <0.1)
- ✅ 95th percentile page load <3s
- ✅ API response time p95 <500ms
- ✅ Lighthouse score >90

### User Experience
- ✅ Onboarding completion rate >60%
- ✅ Time to first value <5 minutes
- ✅ Feature adoption rate >40% for core features
- ✅ Zero blank loading screens

### Security & Compliance
- ✅ WCAG 2.2 AA automated tests passing 100%
- ✅ Zero critical/high vulnerabilities
- ✅ Audit logs capturing all required events
- ✅ Data export working (GDPR compliance)

### Stability
- ✅ Uptime >99.5%
- ✅ Zero critical bugs in production >24 hours
- ✅ Agent execution success rate >95%
- ✅ Zero data loss incidents

---

## Confidence Assessment

| Category | Confidence | Reasoning |
|----------|-----------|-----------|
| **Error handling patterns** | HIGH | Industry best practices well-documented, multiple authoritative sources |
| **Loading/empty states** | HIGH | Standard UX patterns, verified with research |
| **Performance targets** | HIGH | Core Web Vitals are industry standard, benchmarks clear |
| **Security hardening** | MEDIUM | Best practices known, but AMD-specific implementation needs verification |
| **Accessibility** | MEDIUM | WCAG requirements clear, but manual testing needed for 70% of issues |
| **Monitoring setup** | HIGH | Sentry + Vercel Analytics are proven solutions |
| **Effort estimates** | MEDIUM | Based on typical web app complexity, not AMD codebase analysis |
| **AMD-specific needs** | MEDIUM | Research is general SaaS, needs validation with AMD's 37-agent architecture |

---

## Gaps to Address

**Before starting implementation:**

1. **Lighthouse baseline** - Run current performance audit to understand starting point
2. **Error tracking** - What errors are currently happening in dev/staging?
3. **Convex rate limiting** - Does Convex have built-in rate limiting or need external service?
4. **Clerk session config** - Verify current idle timeout settings
5. **Bundle size** - Current bundle size and opportunities for reduction
6. **User testing** - Validate onboarding flow with 5-10 beta users

---

## Key Takeaway for AMD

**Production readiness is not feature development—it's defensive UX and trust-building.** The goal is to never surprise users negatively, always provide clear feedback, and handle every edge case gracefully.

The difference between "works in dev" and "ready for paying customers":
- **Dev:** Happy path works, 37 agents generate content
- **Production:** Every path works OR fails gracefully with clear recovery, users trust the system with their business

AMD's 37-agent complexity makes production readiness even more critical—every agent execution is a potential failure point that needs handling. But AMD's AI intelligence is also an advantage: agents can generate helpful error messages, onboarding guidance, and contextual help.

**Budget:** 6-7 weeks for comprehensive production hardening.
**Confidence:** HIGH that these features are necessary, MEDIUM on exact implementation for AMD's architecture.

---

## Sources Summary

**Primary (HIGH confidence):**
- Error handling: [Pencil & Paper UX](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback), [SaaS UX Design Guide](https://www.designstudiouiux.com/blog/saas-ux-design-the-ultimate-guide/)
- Loading states: [Fishtank Best Practices](https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs), [Smashing Magazine](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/)
- Empty states: [Userpilot](https://userpilot.com/blog/empty-state-saas/), [SaaSFrame](https://www.saasframe.io/categories/empty-state)
- Performance: [Binadox Benchmarking](https://www.binadox.com/blog/saas-performance-benchmarking-industry-standards-for-speed-uptime-and-user-satisfaction/), [Hostinger Stats](https://www.hostinger.com/tutorials/website-load-time-statistics)
- Security: [Nudge Security](https://www.nudgesecurity.com/post/saas-security-best-practices), [CSA State of SaaS Security](https://cloudsecurityalliance.org/artifacts/state-of-saas-security-report-2025)
- Accessibility: [WCAG Guide 2026](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/), [Medium Guide](https://medium.com/@mhdrahman/wcag-for-saas-owners-the-complete-guide-to-web-accessibility-compliance-in-2026-8eb794a9bcfa)
- Monitoring: [Mantrix Tools](https://themantrix.com/en/blog/Top-10-Tools-for-Monitoring-SaaS-Availability-and-Uptime-in-2026), [Better Stack](https://betterstack.com/community/comparisons/error-tracking-tools/)
- Onboarding: [Sales Hacking](https://www.sales-hacking.com/en/post/best-practices-onboarding-saas), [Userpilot](https://userpilot.com/blog/best-user-onboarding-experience/)

**Secondary (MEDIUM confidence):**
- Session management: [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [NIST](https://pages.nist.gov/800-63-4/sp800-63b/session/)
- Audit logging: [Enterprise Ready](https://www.enterpriseready.io/features/audit-log/), [Frontegg](https://frontegg.com/blog/audit-logs-for-saas-enterprise-customers)

---

**Research date:** 2026-02-09
**Valid until:** 2026-04-09 (60 days)
**Total sources:** 30+ across 13 search queries
**Research confidence:** HIGH overall (MEDIUM for AMD-specific implementation)
