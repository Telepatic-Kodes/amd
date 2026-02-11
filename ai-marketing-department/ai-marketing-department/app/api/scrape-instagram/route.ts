import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";

export const maxDuration = 30; // seconds

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "Missing handle parameter" }, { status: 400 });
  }

  // Normalize handle
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

    // Navigate to profile
    const profileUrl = `https://www.instagram.com/${username}/`;
    await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 20000 });

    // Wait for content to render
    await page.waitForTimeout(2000);

    // Handle possible login wall: dismiss it if present
    try {
      const notNowBtn = page.getByRole("button", { name: /not now/i });
      if (await notNowBtn.isVisible({ timeout: 2000 })) {
        await notNowBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No login wall, continue
    }

    // Extract profile data from the page
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
        name: null,
        bio: null,
        website: null,
        followers: null,
        following: null,
        posts: null,
        isPrivate: false,
        recentCaptions: [],
      };

      // Try to extract from meta tags first (most reliable)
      const metaDesc = document.querySelector('meta[property="og:description"]');
      if (metaDesc) {
        const desc = metaDesc.getAttribute("content") || "";
        // Format: "123 Followers, 45 Following, 67 Posts - See Instagram photos and videos from Name (@handle)"
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
        // Format: "Name (@handle) • Instagram photos and videos"
        const nameMatch = title.match(/^(.+?)\s*\(@/);
        if (nameMatch) result.name = nameMatch[1].trim();
      }

      // Try structured data (JSON-LD)
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || "");
          if (data.description && !result.bio) {
            result.bio = data.description;
          }
          if (data.name && !result.name) {
            result.name = data.name;
          }
        } catch {
          // ignore parse errors
        }
      });

      // Extract bio from page content
      // Instagram puts bio in a span inside the header section
      const headerSection = document.querySelector("header");
      if (headerSection) {
        // Bio is typically in the section after the stats
        const spans = headerSection.querySelectorAll("span");
        const statsKeywords = ["followers", "following", "posts", "seguidores", "siguiendo", "publicaciones"];
        const bioSpans: string[] = [];
        spans.forEach((span) => {
          const text = (span.textContent || "").trim();
          if (
            text.length > 10 &&
            text.length < 500 &&
            !statsKeywords.some((k) => text.toLowerCase().includes(k)) &&
            !text.includes("Instagram") &&
            !text.startsWith("@")
          ) {
            bioSpans.push(text);
          }
        });
        if (bioSpans.length > 0 && !result.bio) {
          result.bio = bioSpans.join("\n");
        }

        // External website link
        const links = headerSection.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (
            href.includes("l.instagram.com/") ||
            (!href.includes("instagram.com") && href.startsWith("http"))
          ) {
            result.website = href;
          }
        });
      }

      // Check if account is private
      const pageText = document.body.textContent || "";
      if (pageText.includes("This account is private") || pageText.includes("Esta cuenta es privada")) {
        result.isPrivate = true;
      }

      // Try to get recent post captions (from article elements or similar)
      const articles = document.querySelectorAll("article");
      articles.forEach((article) => {
        const text = (article.textContent || "").trim();
        if (text.length > 20 && text.length < 2000) {
          result.recentCaptions.push(text.substring(0, 500));
        }
      });

      // Also try img alt texts which often contain captions
      const imgs = document.querySelectorAll("img[alt]");
      imgs.forEach((img) => {
        const alt = img.getAttribute("alt") || "";
        if (alt.length > 30 && !alt.startsWith("profile picture") && !alt.includes("Instagram")) {
          result.recentCaptions.push(alt);
        }
      });

      // Deduplicate captions
      result.recentCaptions = [...new Set(result.recentCaptions)].slice(0, 10);

      return result;
    });

    // Also grab the full page text as fallback
    const bodyText = await page.evaluate(() => {
      return (document.body.innerText || "").substring(0, 5000);
    });

    await browser.close();

    // Build content string for brand extraction
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

    const content = parts.join("\n");
    const hasRealData = !!(profileData.name || profileData.bio || profileData.recentCaptions.length > 0);

    return NextResponse.json({
      username,
      profileData,
      content,
      bodyText: hasRealData ? undefined : bodyText,
      hasRealData,
    });
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore cleanup errors
      }
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to scrape Instagram profile",
        username,
      },
      { status: 500 }
    );
  }
}
