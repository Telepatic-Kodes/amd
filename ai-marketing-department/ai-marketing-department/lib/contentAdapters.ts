/**
 * SHARED CONTENT ADAPTERS
 *
 * Pure TypeScript functions for platform-specific content adaptation.
 * NO Convex imports - importable by both backend actions and frontend components.
 *
 * This is the SINGLE SOURCE OF TRUTH for adaptation logic.
 */

// ========================================
// TYPES
// ========================================

export interface AdaptedTwitterContent {
  text: string;
  isThread: boolean;
  tweetCount: number;
}

export interface AdaptedLinkedInContent {
  text: string;
  truncated: boolean;
}

export interface AdaptedInstagramContent {
  caption: string;
  hashtagsAdded: number;
  hashtagsList: string[];
}

export interface PlatformAdaptation {
  adaptedText: string;
  metadata: Record<string, unknown>;
}

export type AdaptedContent = Record<string, PlatformAdaptation>;

// ========================================
// TWITTER ADAPTER
// ========================================

/**
 * Split text into Twitter thread chunks (max 280 chars each)
 * Inline implementation - no dependencies on Convex backend
 */
function splitIntoThread(text: string): string[] {
  const MAX_TWEET_LENGTH = 280;
  const tweets: string[] = [];

  // If fits in single tweet, return as is
  if (text.length <= MAX_TWEET_LENGTH) {
    return [text];
  }

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentTweet = "";

  for (const paragraph of paragraphs) {
    // If paragraph fits in current tweet
    if (currentTweet.length + paragraph.length + 2 <= MAX_TWEET_LENGTH) {
      currentTweet += (currentTweet ? "\n\n" : "") + paragraph;
      continue;
    }

    // Save current tweet if it has content
    if (currentTweet) {
      tweets.push(currentTweet.trim());
      currentTweet = "";
    }

    // If paragraph is too long, split by sentences
    if (paragraph.length > MAX_TWEET_LENGTH) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);

      for (const sentence of sentences) {
        // If sentence fits in current tweet
        if (currentTweet.length + sentence.length + 1 <= MAX_TWEET_LENGTH) {
          currentTweet += (currentTweet ? " " : "") + sentence;
          continue;
        }

        // Save current tweet
        if (currentTweet) {
          tweets.push(currentTweet.trim());
          currentTweet = "";
        }

        // If single sentence is too long, split by words
        if (sentence.length > MAX_TWEET_LENGTH) {
          const words = sentence.split(/\s+/);

          for (const word of words) {
            if (currentTweet.length + word.length + 1 <= MAX_TWEET_LENGTH) {
              currentTweet += (currentTweet ? " " : "") + word;
            } else {
              if (currentTweet) {
                tweets.push(currentTweet.trim());
              }
              currentTweet = word;
            }
          }
        } else {
          currentTweet = sentence;
        }
      }
    } else {
      currentTweet = paragraph;
    }
  }

  // Add final tweet if exists
  if (currentTweet) {
    tweets.push(currentTweet.trim());
  }

  return tweets.length > 0 ? tweets : [text.substring(0, MAX_TWEET_LENGTH)];
}

/**
 * Adapt content for Twitter (280 char limit, thread support)
 */
export function adaptForTwitter(
  body: string,
  hashtags?: string[]
): AdaptedTwitterContent {
  const MAX_TWEET_LENGTH = 280;

  // Single tweet scenario
  if (body.length <= MAX_TWEET_LENGTH) {
    let text = body;

    // Try to append hashtags if space allows
    if (hashtags && hashtags.length > 0) {
      const topHashtags = hashtags.slice(0, 3);
      const hashtagText = topHashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

      if (text.length + hashtagText.length + 2 <= MAX_TWEET_LENGTH) {
        text = `${text}\n\n${hashtagText}`;
      }
    }

    return {
      text,
      isThread: false,
      tweetCount: 1,
    };
  }

  // Thread scenario
  const tweets = splitIntoThread(body);

  // Try to append hashtags to first tweet
  let firstTweet = tweets[0];
  if (hashtags && hashtags.length > 0) {
    const topHashtags = hashtags.slice(0, 3);
    const hashtagText = topHashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

    if (firstTweet.length + hashtagText.length + 2 <= MAX_TWEET_LENGTH) {
      firstTweet = `${firstTweet}\n\n${hashtagText}`;
    }
  }

  return {
    text: firstTweet,
    isThread: true,
    tweetCount: tweets.length,
  };
}

// ========================================
// LINKEDIN ADAPTER
// ========================================

/**
 * Adapt content for LinkedIn (3000 char limit)
 */
export function adaptForLinkedIn(body: string): AdaptedLinkedInContent {
  const MAX_LENGTH = 3000;
  const TRUNCATE_AT = 2990;

  if (body.length <= MAX_LENGTH) {
    return {
      text: body,
      truncated: false,
    };
  }

  // Truncate at last sentence boundary before 2990 chars
  const textUpToLimit = body.substring(0, TRUNCATE_AT);
  const lastSentenceEnd = Math.max(
    textUpToLimit.lastIndexOf('. '),
    textUpToLimit.lastIndexOf('! '),
    textUpToLimit.lastIndexOf('? ')
  );

  const truncatedText = lastSentenceEnd > 0
    ? textUpToLimit.substring(0, lastSentenceEnd + 1)
    : textUpToLimit;

  return {
    text: truncatedText + '...',
    truncated: true,
  };
}

// ========================================
// INSTAGRAM ADAPTER
// ========================================

/**
 * Adapt content for Instagram (2200 char limit, hashtag support)
 */
export function adaptForInstagram(
  body: string,
  hashtags?: string[]
): AdaptedInstagramContent {
  const MAX_LENGTH = 2200;
  const MAX_HASHTAGS = 30;

  let caption = body;
  let hashtagsAdded = 0;
  const hashtagsList: string[] = [];

  // Add hashtags if provided and not already in body
  if (hashtags && hashtags.length > 0) {
    const formattedHashtags = hashtags
      .slice(0, MAX_HASHTAGS)
      .map(tag => {
        // Lowercase and remove spaces
        const formatted = `#${tag.toLowerCase().replace(/\s+/g, '')}`;
        return formatted;
      })
      .filter(tag => !body.toLowerCase().includes(tag.toLowerCase()));

    if (formattedHashtags.length > 0) {
      const hashtagText = formattedHashtags.join(' ');

      // Check if we can append hashtags
      if (caption.length + hashtagText.length + 4 <= MAX_LENGTH) {
        caption = `${caption}\n\n${hashtagText}`;
        hashtagsAdded = formattedHashtags.length;
        hashtagsList.push(...formattedHashtags);
      }
    }
  }

  // Truncate if still too long
  if (caption.length > MAX_LENGTH) {
    caption = caption.substring(0, MAX_LENGTH);
  }

  return {
    caption,
    hashtagsAdded,
    hashtagsList,
  };
}

// ========================================
// MULTI-PLATFORM ADAPTER
// ========================================

/**
 * Adapt content for multiple platforms at once
 */
export function adaptContentForPlatforms(
  body: string,
  platforms: string[],
  hashtags?: string[]
): AdaptedContent {
  const adaptations: AdaptedContent = {};

  for (const platform of platforms) {
    switch (platform.toLowerCase()) {
      case 'twitter':
        const twitterResult = adaptForTwitter(body, hashtags);
        adaptations.twitter = {
          adaptedText: twitterResult.text,
          metadata: {
            isThread: twitterResult.isThread,
            tweetCount: twitterResult.tweetCount,
          },
        };
        break;

      case 'linkedin':
        const linkedinResult = adaptForLinkedIn(body);
        adaptations.linkedin = {
          adaptedText: linkedinResult.text,
          metadata: {
            truncated: linkedinResult.truncated,
          },
        };
        break;

      case 'instagram':
        const instagramResult = adaptForInstagram(body, hashtags);
        adaptations.instagram = {
          adaptedText: instagramResult.caption,
          metadata: {
            hashtagsAdded: instagramResult.hashtagsAdded,
            hashtagsList: instagramResult.hashtagsList,
          },
        };
        break;

      default:
        // Unknown platform - return original
        adaptations[platform] = {
          adaptedText: body,
          metadata: {},
        };
    }
  }

  return adaptations;
}
