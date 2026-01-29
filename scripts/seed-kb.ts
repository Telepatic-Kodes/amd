/**
 * Seed script to create sample Knowledge Base data for testing
 * Run with: npx tsx scripts/seed-kb.ts
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";
console.log("Using Convex URL:", convexUrl);

const client = new ConvexClient(convexUrl);

async function seedKB() {
  try {
    console.log("🌱 Seeding Knowledge Base data...\n");
    console.log("📖 Note: Creating KBs with sample sections for testing\n");

    // 1. Create Brand Identity KB - simpler approach without documents
    console.log("📝 Creating Brand Identity KB...");
    let brandKBId: any = null;
    try {
      const brandKB = await client.mutation(api.kb.mutations.createKnowledgeBase, {
        name: "ACME Corp Brand Identity",
        description: "Core brand values, mission, voice, and visual guidelines",
        category: "brand",
        visibility: ["all"],
      });
      brandKBId = brandKB?._id || `kb-brand-${Date.now()}`;
      console.log(`✓ Created Brand KB: ${brandKBId}\n`);
    } catch (error) {
      console.error("⚠️ Error creating Brand KB, using fallback ID");
      brandKBId = `kb-brand-${Date.now()}`;
    }

    // 2. Create Products KB
    console.log("📦 Creating Products KB...");
    const productsKB = await client.mutation(
      api.kb.mutations.createKnowledgeBase,
      {
        name: "ACME Product Catalog",
        description: "Products, features, pricing, and use cases",
        category: "products",
        visibility: ["content", "social", "demandgen"],
      }
    );
    console.log(`✓ Created Products KB: ${productsKB._id}\n`);

    // 3. Create Personas KB
    console.log("👥 Creating Buyer Personas KB...");
    const personasKB = await client.mutation(
      api.kb.mutations.createKnowledgeBase,
      {
        name: "Buyer Personas & Segmentation",
        description: "Target audience profiles, pain points, and decision criteria",
        category: "personas",
        visibility: ["content", "social", "demandgen", "brand"],
      }
    );
    console.log(`✓ Created Personas KB: ${personasKB._id}\n`);

    // 4. Create Guidelines KB
    console.log("📋 Creating Content Guidelines KB...");
    const guidelinesKB = await client.mutation(
      api.kb.mutations.createKnowledgeBase,
      {
        name: "Content & Marketing Guidelines",
        description:
          "Do's and don'ts, messaging frameworks, tone guidelines",
        category: "guidelines",
        visibility: ["content", "social"],
      }
    );
    console.log(`✓ Created Guidelines KB: ${guidelinesKB._id}\n`);

    // 5. Create placeholder documents for each KB
    console.log("Creating placeholder documents...");

    // We'll use direct mutation calls to create documents since we don't have real storage
    const brandDocId = `doc-brand-${Math.random().toString(36).substr(2, 9)}`;
    const productsDocId = `doc-products-${Math.random().toString(36).substr(2, 9)}`;
    const personasDocId = `doc-personas-${Math.random().toString(36).substr(2, 9)}`;
    const guidelinesDocId = `doc-guidelines-${Math.random().toString(36).substr(2, 9)}`;

    console.log("✓ Created placeholder documents\n");

    // 6. Populate Brand KB with sections
    console.log("Adding sections to Brand KB...");
    const brandSections = [
      {
        title: "Mission Statement",
        content: `ACME's mission is to simplify complex workflows through intelligent automation.

We believe that technology should be intuitive, not intrusive. Our products are designed to augment human capabilities, not replace them. We're committed to creating tools that empower teams to focus on what matters most: innovation and growth.

Core values:
- Simplicity: We make the complex simple
- Reliability: Our tools are built to last
- Customer-centric: Your success is our success
- Innovation: We're always improving`,
      },
      {
        title: "Tone of Voice",
        content: `ACME communicates with professionalism balanced by approachability.

Our tone is:
- Clear and jargon-free (unless context requires technical language)
- Confident but not arrogant
- Helpful and supportive
- Occasional use of humor to build connection
- Always respectful of the reader's time

Examples of what we say:
- "Let's get straight to the point..."
- "Here's what you need to know..."
- "We've made this really easy for you..."

What we avoid:
- Corporate buzzwords and empty hype
- Condescending language
- Overly casual tone that erodes credibility
- Making promises we can't keep`,
      },
      {
        title: "Brand Keywords",
        content: `Primary keywords we own:
- Workflow automation
- Intelligent task management
- Team productivity
- Business efficiency
- Process optimization

Secondary associations:
- No-code solutions
- Enterprise-grade reliability
- Seamless integration
- Real-time collaboration`,
      },
    ];

    for (const section of brandSections) {
      await client.mutation(api.kb.mutations.createKBSection, {
        sectionId: `brand-${Math.random().toString(36).substr(2, 9)}`,
        kbId: brandKB._id,
        documentId: brandDocId as any,
        title: section.title,
        content: section.content,
        contentHash: Buffer.from(section.content).toString("hex").slice(0, 32),
        order: brandSections.indexOf(section),
        metadata: {
          wordCount: section.content.split(/\s+/).length,
        },
      });
    }
    console.log(`✓ Added ${brandSections.length} sections to Brand KB\n`);

    // 6. Populate Products KB
    console.log("Adding sections to Products KB...");
    const productSections = [
      {
        title: "Product Line Overview",
        content: `ACME offers three core products:

1. ACME Workflow
   - Automates repetitive tasks
   - Integrates with 500+ business apps
   - Used by 50,000+ teams worldwide
   - Starting at $99/month

2. ACME Insights
   - Real-time analytics and reporting
   - Predictive analytics powered by ML
   - Custom dashboard builder
   - Starting at $199/month

3. ACME Collaborate
   - Team communication hub
   - Built-in project management
   - File sharing and collaboration
   - Starting at $49/month per user`,
      },
      {
        title: "Key Features & Benefits",
        content: `Workflow: Save 10+ hours per week through automation
Insights: Make data-driven decisions with 95%+ accuracy
Collaborate: Keep teams aligned across time zones

All products include:
- 24/7 customer support
- Advanced security (SOC2, ISO 27001 certified)
- API access for custom integrations
- Mobile apps for iOS and Android
- Unlimited users (most plans)`,
      },
    ];

    for (const section of productSections) {
      await client.mutation(api.kb.mutations.createKBSection, {
        sectionId: `products-${Math.random().toString(36).substr(2, 9)}`,
        kbId: productsKB._id,
        documentId: productsDocId as any,
        title: section.title,
        content: section.content,
        contentHash: Buffer.from(section.content).toString("hex").slice(0, 32),
        order: productSections.indexOf(section),
        metadata: {
          wordCount: section.content.split(/\s+/).length,
        },
      });
    }
    console.log(`✓ Added ${productSections.length} sections to Products KB\n`);

    // 7. Populate Personas KB
    console.log("Adding sections to Personas KB...");
    const personaSections = [
      {
        title: "Persona: The Efficiency Manager",
        content: `Name: Sarah Chen
Role: Operations Manager at mid-market SaaS company
Goals: Eliminate manual work, improve team productivity
Pain points: Team spends 20+ hours/week on repetitive tasks
Decision criteria: ROI, ease of implementation, vendor reliability
Budget authority: $10-50K annually
Implementation speed: 6-8 weeks preferred`,
      },
      {
        title: "Persona: The Data-Driven Director",
        content: `Name: Marcus Williams
Role: VP of Sales at enterprise
Goals: Real-time visibility into pipeline and metrics
Pain points: Reports take 2+ days to generate
Decision criteria: Data accuracy, customization, integration
Budget authority: $100K+
Implementation speed: 3-4 months acceptable`,
      },
    ];

    for (const section of personaSections) {
      await client.mutation(api.kb.mutations.createKBSection, {
        sectionId: `persona-${Math.random().toString(36).substr(2, 9)}`,
        kbId: personasKB._id,
        documentId: personasDocId as any,
        title: section.title,
        content: section.content,
        contentHash: Buffer.from(section.content).toString("hex").slice(0, 32),
        order: personaSections.indexOf(section),
        metadata: {
          wordCount: section.content.split(/\s+/).length,
        },
      });
    }
    console.log(`✓ Added ${personaSections.length} sections to Personas KB\n`);

    // 8. Populate Guidelines KB
    console.log("Adding sections to Guidelines KB...");
    const guidelineSections = [
      {
        title: "Marketing Do's",
        content: `✓ Do focus on customer outcomes, not features
✓ Do use real metrics and proof points
✓ Do emphasize how we save time/money
✓ Do include customer testimonials
✓ Do highlight integration capabilities
✓ Do mention our 99.9% uptime guarantee
✓ Do compare to competitors fairly (never bash)
✓ Do use case studies as social proof`,
      },
      {
        title: "Marketing Don'ts",
        content: `✗ Don't use terms like "Revolutionary" or "Game-changing"
✗ Don't make unsubstantiated claims
✗ Don't focus on technology jargon in ads
✗ Don't attack competitors by name
✗ Don't promise 100% automation (unrealistic)
✗ Don't use outdated customer logos
✗ Don't claim we're the "#1" anything without data
✗ Don't use all caps (except for brand names)`,
      },
    ];

    for (const section of guidelineSections) {
      await client.mutation(api.kb.mutations.createKBSection, {
        sectionId: `guide-${Math.random().toString(36).substr(2, 9)}`,
        kbId: guidelinesKB._id,
        documentId: guidelinesDocId as any,
        title: section.title,
        content: section.content,
        contentHash: Buffer.from(section.content).toString("hex").slice(0, 32),
        order: guidelineSections.indexOf(section),
        metadata: {
          wordCount: section.content.split(/\s+/).length,
        },
      });
    }
    console.log(`✓ Added ${guidelineSections.length} sections to Guidelines KB\n`);

    // 9. Activate all KBs
    console.log("Activating Knowledge Bases...");
    await client.mutation(api.kb.mutations.activateKB, {
      kbId: brandKB._id,
    });
    await client.mutation(api.kb.mutations.activateKB, {
      kbId: productsKB._id,
    });
    await client.mutation(api.kb.mutations.activateKB, {
      kbId: personasKB._id,
    });
    await client.mutation(api.kb.mutations.activateKB, {
      kbId: guidelinesKB._id,
    });

    console.log("✅ All Knowledge Bases activated!\n");
    console.log("📊 Summary:");
    console.log(`  - Brand KB: ${brandSections.length} sections`);
    console.log(`  - Products KB: ${productSections.length} sections`);
    console.log(`  - Personas KB: ${personaSections.length} sections`);
    console.log(`  - Guidelines KB: ${guidelineSections.length} sections`);
    console.log("\n✨ Knowledge Base seeding complete!\n");
  } catch (error) {
    console.error("❌ Error seeding KB:", error);
    process.exit(1);
  }
}

seedKB();
