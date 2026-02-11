import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";

export const maxDuration = 45; // seconds — scraping IG + fetching website

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  const website = request.nextUrl.searchParams.get("website");

  if (!handle && !website) {
    return NextResponse.json(
      { error: "At least one of 'handle' or 'website' is required" },
      { status: 400 }
    );
  }

  let instagramData: Record<string, unknown> | null = null;
  let instagramContent = "";
  let websiteData: string | null = null;

  // 1. Scrape Instagram if handle provided
  if (handle) {
    let username = handle.trim();
    if (username.startsWith("@")) username = username.slice(1);
    const urlMatch = username.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/);
    if (urlMatch) username = urlMatch[1];

    if (!username || username.length < 2) {
      return NextResponse.json({ error: "Invalid Instagram handle" }, { status: 400 });
    }

    let browser;
    try {
      browser = await chromium.launch({
        executablePath: "/usr/bin/chromium",
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale: "en-US",
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      const profileUrl = `https://www.instagram.com/${username}/`;
      await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(2000);

      // Dismiss login wall if present
      try {
        const notNowBtn = page.getByRole("button", { name: /not now/i });
        if (await notNowBtn.isVisible({ timeout: 2000 })) {
          await notNowBtn.click();
          await page.waitForTimeout(500);
        }
      } catch {
        // No login wall
      }

      // Extract profile data
      const profileData = await page.evaluate(() => {
        const result: {
          name: string | null;
          bio: string | null;
          website: string | null;
          followers: string | null;
          following: string | null;
          posts: string | null;
          isPrivate: boolean;
          recentCaptions: string[];
        } = {
          name: null, bio: null, website: null,
          followers: null, following: null, posts: null,
          isPrivate: false, recentCaptions: [],
        };

        // Meta tags (most reliable)
        const metaDesc = document.querySelector('meta[property="og:description"]');
        if (metaDesc) {
          const desc = metaDesc.getAttribute("content") || "";
          const statsMatch = desc.match(
            /^([\d,.KMkm]+)\s+Followers?,\s*([\d,.KMkm]+)\s+Following,\s*([\d,.KMkm]+)\s+Posts?\s*[-–—]\s*(?:See Instagram.*from\s+)?(.+?)(?:\s*\(@[^)]+\))?$/i
          );
          if (statsMatch) {
            result.followers = statsMatch[1];
            result.following = statsMatch[2];
            result.posts = statsMatch[3];
            result.name = statsMatch[4].trim();
          }
        }

        const metaTitle = document.querySelector('meta[property="og:title"]');
        if (metaTitle && !result.name) {
          const title = metaTitle.getAttribute("content") || "";
          const nameMatch = title.match(/^(.+?)\s*\(@/);
          if (nameMatch) result.name = nameMatch[1].trim();
        }

        // JSON-LD
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach((script) => {
          try {
            const data = JSON.parse(script.textContent || "");
            if (data.description && !result.bio) result.bio = data.description;
            if (data.name && !result.name) result.name = data.name;
          } catch { /* ignore */ }
        });

        // Bio from header
        const headerSection = document.querySelector("header");
        if (headerSection) {
          const spans = headerSection.querySelectorAll("span");
          const statsKeywords = ["followers", "following", "posts", "seguidores", "siguiendo", "publicaciones"];
          const bioSpans: string[] = [];
          spans.forEach((span) => {
            const text = (span.textContent || "").trim();
            if (text.length > 10 && text.length < 500 &&
              !statsKeywords.some((k) => text.toLowerCase().includes(k)) &&
              !text.includes("Instagram") && !text.startsWith("@")) {
              bioSpans.push(text);
            }
          });
          if (bioSpans.length > 0 && !result.bio) result.bio = bioSpans.join("\n");

          // External website
          const links = headerSection.querySelectorAll("a[href]");
          links.forEach((link) => {
            const href = link.getAttribute("href") || "";
            if (href.includes("l.instagram.com/") ||
              (!href.includes("instagram.com") && href.startsWith("http"))) {
              result.website = href;
            }
          });
        }

        // Private check
        const pageText = document.body.textContent || "";
        if (pageText.includes("This account is private") || pageText.includes("Esta cuenta es privada")) {
          result.isPrivate = true;
        }

        // Recent captions from articles + img alts
        const articles = document.querySelectorAll("article");
        articles.forEach((article) => {
          const text = (article.textContent || "").trim();
          if (text.length > 20 && text.length < 2000) result.recentCaptions.push(text.substring(0, 500));
        });
        const imgs = document.querySelectorAll("img[alt]");
        imgs.forEach((img) => {
          const alt = img.getAttribute("alt") || "";
          if (alt.length > 30 && !alt.startsWith("profile picture") && !alt.includes("Instagram")) {
            result.recentCaptions.push(alt);
          }
        });
        result.recentCaptions = [...new Set(result.recentCaptions)].slice(0, 12);

        return result;
      });

      await browser.close();

      instagramData = profileData;

      // Build content string
      const parts: string[] = [
        `Instagram Profile: @${username}`,
        `URL: ${profileUrl}`,
      ];
      if (profileData.name) parts.push(`Full Name: ${profileData.name}`);
      if (profileData.bio) parts.push(`Bio: ${profileData.bio}`);
      if (profileData.website) parts.push(`Website: ${profileData.website}`);
      if (profileData.followers) parts.push(`Followers: ${profileData.followers}`);
      if (profileData.following) parts.push(`Following: ${profileData.following}`);
      if (profileData.posts) parts.push(`Posts: ${profileData.posts}`);
      if (profileData.isPrivate) parts.push(`Account Type: Private`);
      if (profileData.recentCaptions.length > 0) {
        parts.push(`\nRecent Post Captions/Descriptions:`);
        profileData.recentCaptions.forEach((caption, i) => {
          parts.push(`${i + 1}. ${caption}`);
        });
      }
      instagramContent = parts.join("\n");
    } catch (error) {
      if (browser!) {
        try { await browser.close(); } catch { /* ignore */ }
      }
      instagramContent = `[Instagram scrape failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
    }
  }

  // 2. Fetch website if URL provided
  if (website) {
    try {
      const res = await fetch(website, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AMDBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      // Basic HTML-to-text: strip tags, collapse whitespace
      websiteData = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 8000);
    } catch (error) {
      websiteData = `[Website fetch failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
    }
  }

  // 3. Combine content
  const combinedParts: string[] = [];
  if (instagramContent) {
    combinedParts.push("=== INSTAGRAM DATA ===\n" + instagramContent);
  }
  if (websiteData) {
    combinedParts.push("=== WEBSITE DATA ===\n" + websiteData);
  }

  return NextResponse.json({
    instagramData,
    websiteData: websiteData ? websiteData.substring(0, 2000) : null,
    combinedContent: combinedParts.join("\n\n"),
  });
}
