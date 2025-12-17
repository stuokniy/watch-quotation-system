import { describe, expect, it } from "vitest";
import {
  extractPhoneNumber,
  extractPrice,
  extractWatchModel,
  extractWarrantyDate,
  parseWhatsAppChat,
  parseWhatsAppChatFile,
} from "./whatsappParser";

describe("WhatsApp Parser", () => {
  describe("parseWhatsAppChat", () => {
    it("should parse basic WhatsApp message format", () => {
      const chatText = `01/12/2023, 10:30 - John Doe: Hello
01/12/2023, 10:31 - Jane Smith: Hi there`;

      const messages = parseWhatsAppChat(chatText);

      expect(messages).toHaveLength(2);
      expect(messages[0]?.author).toBe("John Doe");
      expect(messages[0]?.message).toBe("Hello");
      expect(messages[1]?.author).toBe("Jane Smith");
      expect(messages[1]?.message).toBe("Hi there");
    });

    it("should handle multi-line messages", () => {
      const chatText = `01/12/2023, 10:30 - John: Line 1
Line 2
Line 3`;

      const messages = parseWhatsAppChat(chatText);

      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("Line 1\nLine 2\nLine 3");
    });
  });

  describe("extractPhoneNumber", () => {
    it("should extract international phone number", () => {
      const phone = extractPhoneNumber("+852 1234 5678");
      expect(phone).toBe("+85212345678");
    });

    it("should extract Hong Kong 8-digit number", () => {
      const phone = extractPhoneNumber("Contact: 91234567");
      expect(phone).toBe("+85291234567");
    });

    it("should handle phone number without prefix", () => {
      const phone = extractPhoneNumber("12345678");
      expect(phone).toBeTruthy();
    });
  });

  describe("extractWatchModel", () => {
    it("should extract Rolex model numbers", () => {
      const models = extractWatchModel("I have a Rolex 116500LN for sale");
      expect(models).toContain("116500LN");
    });

    it("should extract Patek Philippe model numbers", () => {
      const models = extractWatchModel("Patek 5711/1A available");
      expect(models).toContain("5711/1A");
    });

    it("should extract multiple models from one message", () => {
      const models = extractWatchModel("I have 116500LN and 126710BLRO");
      expect(models.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle Chinese brand names", () => {
      const models = extractWatchModel("勞力士 116500LN 有貨");
      expect(models).toContain("116500LN");
    });
  });

  describe("extractPrice", () => {
    it("should extract HKD price with dollar sign", () => {
      const price = extractPrice("Price: $50000");
      expect(price).toEqual({ amount: 5000000, currency: "HKD" });
    });

    it("should extract price with HKD prefix", () => {
      const price = extractPrice("HKD 50,000");
      // 50,000 * 100 = 5,000,000 cents
      expect(price).toEqual({ amount: 5000000, currency: "HKD" });
    });

    it("should extract price with k suffix", () => {
      const price = extractPrice("Price: $50k");
      expect(price).toEqual({ amount: 5000000, currency: "HKD" });
    });

    it("should extract USD price", () => {
      const price = extractPrice("USD 10000");
      expect(price).toEqual({ amount: 1000000, currency: "USD" });
    });

    it("should extract CNY price", () => {
      const price = extractPrice("¥30000");
      expect(price).toEqual({ amount: 3000000, currency: "CNY" });
    });

    it("should handle Chinese 萬 (ten thousand)", () => {
      const price = extractPrice("5萬");
      expect(price).toEqual({ amount: 5000000, currency: "HKD" });
    });
  });

  describe("extractWarrantyDate", () => {
    it("should extract warranty date with keyword", () => {
      const date = extractWarrantyDate("保卡 2023-01-15");
      expect(date).toBe("2023-01-15");
    });

    it("should extract warranty date in different format", () => {
      const date = extractWarrantyDate("warranty card date: 01/15/2023");
      expect(date).toBe("01/15/2023");
    });

    it("should return null without warranty keyword", () => {
      const date = extractWarrantyDate("Just a date 2023-01-15");
      expect(date).toBeNull();
    });
  });

  describe("parseWhatsAppChatFile", () => {
    it("should parse complete chat and extract quotations", () => {
      const chatText = `01/12/2023, 10:30 - Seller A: I have Rolex 116500LN, price $150000, 保卡 2022-06-15
01/12/2023, 10:35 - Buyer: Interested
01/12/2023, 10:40 - Seller B: Patek 5711/1A available, HKD 800,000`;

      const result = parseWhatsAppChatFile(chatText);

      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.quotations.length).toBeGreaterThan(0);

      // Check first quotation
      const firstQuote = result.quotations[0];
      expect(firstQuote?.watchModel).toBeTruthy();
      expect(firstQuote?.price).toBeGreaterThan(0);
      expect(firstQuote?.currency).toBeTruthy();
    });

    it("should handle chat with no quotations", () => {
      const chatText = `01/12/2023, 10:30 - John: Hello
01/12/2023, 10:31 - Jane: How are you?`;

      const result = parseWhatsAppChatFile(chatText);

      expect(result.messages.length).toBe(2);
      expect(result.quotations.length).toBe(0);
    });
  });
});
