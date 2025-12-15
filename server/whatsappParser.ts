/**
 * WhatsApp Chat Parser
 * Parses exported WhatsApp chat text files and extracts watch quotations
 */

export interface ParsedMessage {
  date: Date;
  author: string | null;
  message: string;
  phoneNumber?: string;
}

export interface ExtractedQuotation {
  watchModel: string;
  price: number; // in cents
  currency: string;
  warrantyDate?: string;
  sellerPhone: string;
  sellerName?: string;
  quoteDate: Date;
  messageText: string;
}

/**
 * Parse WhatsApp chat export text into structured messages
 * Supports multiple date formats:
 * - DD/MM/YYYY, HH:MM - Name: Message
 * - MM/DD/YYYY, HH:MM - Name: Message
 * - YYYY-MM-DD, HH:MM - Name: Message
 * - [DD/MM/YYYY, HH:MM:SS] Name: Message
 */
export function parseWhatsAppChat(chatText: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const lines = chatText.split('\n');
  
  // Common WhatsApp message patterns
  const patterns = [
    // Pattern 1: DD/MM/YYYY, HH:MM - Name: Message or MM/DD/YYYY, HH:MM - Name: Message
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*[-–]\s*([^:]+):\s*(.+)$/i,
    // Pattern 2: [DD/MM/YYYY, HH:MM:SS] Name: Message
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.+)$/i,
    // Pattern 3: YYYY-MM-DD HH:MM - Name: Message
    /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s*(.+)$/i,
  ];

  let currentMessage: ParsedMessage | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }

        const [, dateStr, timeStr, author, message] = match;
        const date = parseWhatsAppDate(dateStr, timeStr);
        
        currentMessage = {
          date,
          author: author.trim(),
          message: message.trim(),
        };
        matched = true;
        break;
      }
    }

    // If no pattern matched, this might be a continuation of the previous message
    if (!matched && currentMessage) {
      currentMessage.message += '\n' + line;
    }
  }

  // Add the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

/**
 * Parse date string from WhatsApp export
 */
function parseWhatsAppDate(dateStr: string, timeStr: string): Date {
  // Remove brackets if present
  dateStr = dateStr.replace(/[\[\]]/g, '');
  timeStr = timeStr.replace(/[\[\]]/g, '');

  // Try different date formats
  let date: Date;

  if (dateStr.includes('-')) {
    // YYYY-MM-DD format
    date = new Date(`${dateStr} ${timeStr}`);
  } else {
    // DD/MM/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [first, second, year] = parts;
      // Try DD/MM/YYYY first (more common internationally)
      date = new Date(`${year}-${second}-${first} ${timeStr}`);
      
      // If invalid, try MM/DD/YYYY (US format)
      if (isNaN(date.getTime())) {
        date = new Date(`${year}-${first}-${second} ${timeStr}`);
      }
    } else {
      date = new Date();
    }
  }

  return date;
}

/**
 * Extract phone number from author name or message
 * Supports formats: +852 1234 5678, +86 138 1234 5678, 12345678, etc.
 */
export function extractPhoneNumber(text: string): string | null {
  // Remove common prefixes
  text = text.replace(/^(Contact|聯絡|联系)[:：\s]*/i, '');
  
  // Pattern 1: International format with +
  const intlPattern = /\+\d{1,4}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{0,4}/;
  const intlMatch = text.match(intlPattern);
  if (intlMatch) {
    return intlMatch[0].replace(/[\s-]/g, '');
  }

  // Pattern 2: Hong Kong 8-digit number
  const hkPattern = /\b[2-9]\d{7}\b/;
  const hkMatch = text.match(hkPattern);
  if (hkMatch) {
    return '+852' + hkMatch[0];
  }

  // Pattern 3: Any sequence of 8-15 digits
  const generalPattern = /\b\d{8,15}\b/;
  const generalMatch = text.match(generalPattern);
  if (generalMatch) {
    return generalMatch[0];
  }

  return null;
}

/**
 * Extract watch model from message text
 * Supports common formats from major brands
 */
export function extractWatchModel(text: string): string[] {
  const models: string[] = [];
  
  // Common watch model patterns
  const patterns = [
    // Rolex: 6 digits, optional letters (e.g., 116500LN, 126710BLRO)
    /\b\d{6}[A-Z]{0,6}\b/g,
    // Patek Philippe: 4-5 digits with slash and letters (e.g., 5711/1A, 5990/1A-001)
    /\b\d{4,5}\/\d{1,2}[A-Z]{0,5}(?:-\d{3})?\b/g,
    // Audemars Piguet: 5 digits with letters (e.g., 15500ST, 26331ST)
    /\b\d{5}[A-Z]{2,4}\b/g,
    // General: Model number with brand name
    /(?:Rolex|Patek|AP|Audemars|Omega|Cartier|IWC|Panerai|勞力士|百達翡麗|愛彼|歐米茄|卡地亞)\s+[A-Z0-9\/-]{4,15}/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      models.push(...matches);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(models));
}

/**
 * Extract price from message text
 * Supports multiple currencies and formats
 */
export function extractPrice(text: string): { amount: number; currency: string } | null {
  // Patterns for different price formats
  const patterns = [
    // HKD formats: $50000, HKD 50,000, HK$50000, 50k, 5萬
    { pattern: /(?:HKD?|HK\$|港幣|港币)[\s]?[\$]?([\d,]+(?:\.\d{2})?)[kK萬万]?/i, currency: 'HKD' },
    { pattern: /\$\s?([\d,]+(?:\.\d{2})?)[kK萬万]?(?:\s?HKD)?/i, currency: 'HKD' },
    // USD formats
    { pattern: /(?:USD|US\$|美金|美元)[\s]?[\$]?([\d,]+(?:\.\d{2})?)[kK]?/i, currency: 'USD' },
    // CNY formats
    { pattern: /(?:CNY|RMB|人民币|人民幣)[\s]?[¥]?([\d,]+(?:\.\d{2})?)[kK萬万]?/i, currency: 'CNY' },
    { pattern: /¥\s?([\d,]+(?:\.\d{2})?)[kK萬万]?/i, currency: 'CNY' },
    // EUR formats
    { pattern: /(?:EUR|€|歐元|欧元)[\s]?([\d,]+(?:\.\d{2})?)[kK]?/i, currency: 'EUR' },
  ];

  for (const { pattern, currency } of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amountStr = match[1].replace(/,/g, '');
      let amount = parseFloat(amountStr);

      // Check if the matched text contains multiplier suffixes
      // Extract only the number part (after currency prefix) to avoid matching K in HKD
      const matchedText = match[0];
      const numberPart = match[1]; // The captured group is just the number
      
      // Handle 'k' suffix (thousands) - check in the original matched text after the number
      const afterNumber = matchedText.substring(matchedText.indexOf(numberPart) + numberPart.length);
      if (afterNumber.match(/[kK]/)) {
        amount *= 1000;
      }
      // Handle Chinese '萬' (ten thousands)
      if (afterNumber.match(/[萬万]/)) {
        amount *= 10000;
      }

      // Convert to cents
      amount = Math.round(amount * 100);

      return { amount, currency };
    }
  }

  // Fallback: try to match standalone Chinese amount with 萬
  const chinesePattern = /(\d+(?:\.\d+)?)[萬万]/;
  const chineseMatch = text.match(chinesePattern);
  if (chineseMatch) {
    let amount = parseFloat(chineseMatch[1]) * 10000;
    amount = Math.round(amount * 100);
    return { amount, currency: 'HKD' };
  }

  return null;
}

/**
 * Extract warranty date from message text
 */
export function extractWarrantyDate(text: string): string | null {
  // Keywords that indicate warranty date
  const keywords = ['保卡', '保修卡', 'warranty', 'card date', '卡日期'];
  
  // Check if message contains warranty keywords
  const hasKeyword = keywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasKeyword) return null;

  // Date patterns
  const patterns = [
    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    /\b(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/,
    // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
    // YYYY年MM月 or YYYY年MM月DD日
    /(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/,
    // Month YYYY (e.g., Jan 2023, January 2023)
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extract quotations from parsed messages
 */
export function extractQuotations(messages: ParsedMessage[]): ExtractedQuotation[] {
  const quotations: ExtractedQuotation[] = [];

  for (const msg of messages) {
    // Skip system messages
    if (!msg.author) continue;

    const models = extractWatchModel(msg.message);
    const priceInfo = extractPrice(msg.message);
    
    // Must have both model and price to be a valid quotation
    if (models.length === 0 || !priceInfo) continue;

    const warrantyDate = extractWarrantyDate(msg.message);
    const phoneNumber = extractPhoneNumber(msg.author) || extractPhoneNumber(msg.message);

    // Create a quotation for each model found
    for (const model of models) {
      quotations.push({
        watchModel: model,
        price: priceInfo.amount,
        currency: priceInfo.currency,
        warrantyDate: warrantyDate || undefined,
        sellerPhone: phoneNumber || msg.author, // Fallback to author name if no phone
        sellerName: msg.author,
        quoteDate: msg.date,
        messageText: msg.message,
      });
    }
  }

  return quotations;
}

/**
 * Main function to parse WhatsApp chat and extract quotations
 */
export function parseWhatsAppChatFile(chatText: string): {
  messages: ParsedMessage[];
  quotations: ExtractedQuotation[];
} {
  const messages = parseWhatsAppChat(chatText);
  const quotations = extractQuotations(messages);

  return {
    messages,
    quotations,
  };
}
