import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  onboarding: defineTable({
    companyName: v.string(),
    industry: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
    channels: v.array(v.string()),
    feeds: v.array(v.string()),
    departments: v.array(v.string()),
    completedAt: v.number(),
  }),
});
