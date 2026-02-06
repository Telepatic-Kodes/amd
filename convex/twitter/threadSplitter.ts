/**
 * Twitter Thread Splitter Utility
 *
 * Pure function to split long text into tweet-sized chunks.
 * Follows Twitter's 280 character limit with smart splitting.
 */

export type ThreadResult = {
  tweets: string[];
  isThread: boolean;
  totalChars: number;
};

/**
 * Split text into Twitter-compatible tweets (max 280 chars)
 *
 * @param text - Content to split
 * @param maxLength - Max chars per tweet (default 280)
 * @returns ThreadResult with tweets array and metadata
 *
 * Algorithm:
 * 1. If text fits in one tweet → return single tweet
 * 2. For threads → add indicators like "(1/3)" at end
 * 3. Account for indicator length when splitting
 * 4. Split on paragraph breaks → sentences → words
 * 5. Never break mid-word
 * 6. Truncate single words exceeding limit with "..."
 */
export function splitIntoThread(
  text: string,
  maxLength: number = 280
): ThreadResult {
  const trimmedText = text.trim();
  const totalChars = trimmedText.length;

  // Case 1: Empty text
  if (totalChars === 0) {
    return { tweets: [], isThread: false, totalChars: 0 };
  }

  // Case 2: Fits in single tweet
  if (trimmedText.length <= maxLength) {
    return {
      tweets: [trimmedText],
      isThread: false,
      totalChars,
    };
  }

  // Case 3: Thread needed
  // First, split into chunks without indicators
  const chunks = splitIntoChunks(trimmedText, maxLength);

  // Calculate indicator length: " (1/N)" where N is total chunks
  const totalTweets = chunks.length;
  const indicatorLength = ` (${totalTweets}/${totalTweets})`.length; // Max length

  // Re-split accounting for indicator
  const effectiveMaxLength = maxLength - indicatorLength;
  const finalChunks = splitIntoChunks(trimmedText, effectiveMaxLength);

  // Add thread indicators
  const tweets = finalChunks.map((chunk, idx) => {
    const position = idx + 1;
    return `${chunk} (${position}/${finalChunks.length})`;
  });

  return {
    tweets,
    isThread: true,
    totalChars,
  };
}

/**
 * Split text into chunks respecting word boundaries
 * Internal helper function
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // If remaining fits, we're done
    if (remaining.length <= maxLength) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to split on paragraph break (\n\n)
    const paragraphBreak = remaining.lastIndexOf("\n\n", maxLength);
    if (paragraphBreak > maxLength / 2) {
      chunks.push(remaining.substring(0, paragraphBreak).trim());
      remaining = remaining.substring(paragraphBreak + 2).trim();
      continue;
    }

    // Try to split on single newline
    const newlineBreak = remaining.lastIndexOf("\n", maxLength);
    if (newlineBreak > maxLength / 2) {
      chunks.push(remaining.substring(0, newlineBreak).trim());
      remaining = remaining.substring(newlineBreak + 1).trim();
      continue;
    }

    // Try to split on sentence break (. ! ?)
    const sentenceBreak = findLastSentenceBreak(remaining, maxLength);
    if (sentenceBreak > maxLength / 2) {
      chunks.push(remaining.substring(0, sentenceBreak + 1).trim());
      remaining = remaining.substring(sentenceBreak + 1).trim();
      continue;
    }

    // Try to split on word boundary (space)
    const spaceBreak = remaining.lastIndexOf(" ", maxLength);
    if (spaceBreak > 0) {
      chunks.push(remaining.substring(0, spaceBreak).trim());
      remaining = remaining.substring(spaceBreak + 1).trim();
      continue;
    }

    // Last resort: single word exceeds maxLength → truncate with "..."
    if (remaining.length > maxLength) {
      chunks.push(remaining.substring(0, maxLength - 3) + "...");
      remaining = remaining.substring(maxLength - 3).trim();
    } else {
      chunks.push(remaining.trim());
      break;
    }
  }

  // Filter out any empty chunks (whitespace only)
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Find the last sentence-ending punctuation within maxLength
 */
function findLastSentenceBreak(text: string, maxLength: number): number {
  const sentenceEnders = [". ", "! ", "? "];
  let lastBreak = -1;

  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, maxLength);
    if (pos > lastBreak) {
      lastBreak = pos;
    }
  }

  return lastBreak;
}
