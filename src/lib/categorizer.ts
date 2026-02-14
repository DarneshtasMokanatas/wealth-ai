import { Category, CategoryType } from "./types";

export const CATEGORIES: Record<CategoryType, Category> = {
  food: { id: "food", name: "Food & Dining", icon: "🍔", color: "#f97316" },
  transport: { id: "transport", name: "Transport", icon: "🚗", color: "#3b82f6" },
  shopping: { id: "shopping", name: "Shopping", icon: "🛍️", color: "#a855f7" },
  entertainment: { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#ec4899" },
  bills: { id: "bills", name: "Bills & Utilities", icon: "💡", color: "#eab308" },
  health: { id: "health", name: "Health", icon: "💊", color: "#14b8a6" },
  travel: { id: "travel", name: "Travel", icon: "✈️", color: "#06b6d4" },
  education: { id: "education", name: "Education", icon: "📚", color: "#8b5cf6" },
  income: { id: "income", name: "Income", icon: "💰", color: "#22c55e" },
  savings: { id: "savings", name: "Savings", icon: "🏦", color: "#10b981" },
  other: { id: "other", name: "Other", icon: "📦", color: "#6b7280" },
};

// keyword-based auto-categorization engine
const CATEGORY_KEYWORDS: Record<CategoryType, string[]> = {
  food: [
    "food", "lunch", "dinner", "breakfast", "coffee", "cafe", "restaurant",
    "burrito", "pizza", "sushi", "burger", "taco", "sandwich", "snack",
    "groceries", "grocery", "supermarket", "starbucks", "mcdonalds",
    "doordash", "ubereats", "grubhub", "chipotle", "bakery", "bar",
    "drink", "beer", "wine", "meal", "eat", "ate", "cook", "kitchen",
  ],
  transport: [
    "uber", "lyft", "taxi", "cab", "bus", "train", "metro", "subway",
    "gas", "fuel", "parking", "toll", "car", "auto", "vehicle", "ride",
    "commute", "transit", "flight", "airline", "transport",
  ],
  shopping: [
    "amazon", "shopping", "clothes", "clothing", "shoes", "shirt", "pants",
    "dress", "jacket", "store", "mall", "target", "walmart", "costco",
    "electronics", "gadget", "phone", "laptop", "bought", "purchase",
    "order", "online", "retail",
  ],
  entertainment: [
    "movie", "film", "cinema", "netflix", "spotify", "hulu", "disney",
    "game", "gaming", "concert", "show", "theater", "museum", "ticket",
    "subscription", "streaming", "youtube", "twitch", "music", "fun",
    "party", "event", "festival",
  ],
  bills: [
    "bill", "utility", "electric", "electricity", "water", "internet",
    "wifi", "phone bill", "rent", "mortgage", "insurance", "tax",
    "payment", "subscription", "plan", "monthly", "lease",
  ],
  health: [
    "doctor", "hospital", "pharmacy", "medicine", "medical", "health",
    "dental", "dentist", "gym", "fitness", "workout", "yoga", "therapy",
    "vitamin", "supplement", "prescription", "clinic", "healthcare",
  ],
  travel: [
    "hotel", "airbnb", "booking", "vacation", "trip", "travel", "resort",
    "hostel", "luggage", "passport", "tourist", "sightseeing", "tour",
  ],
  education: [
    "course", "class", "school", "university", "college", "tuition",
    "book", "textbook", "udemy", "coursera", "tutorial", "learn",
    "education", "training", "workshop", "seminar", "study",
  ],
  income: [
    "salary", "paycheck", "income", "freelance", "payment received",
    "bonus", "dividend", "refund", "reimbursement", "earned", "paid",
    "wage", "commission", "tip", "interest",
  ],
  savings: [
    "savings", "invest", "investment", "deposit", "401k", "ira",
    "stock", "crypto", "bitcoin", "bond", "fund", "portfolio",
  ],
  other: [],
};

export interface ParsedExpense {
  amount: number;
  description: string;
  category: CategoryType;
  type: "expense" | "income";
}

export function parseExpenseInput(input: string): ParsedExpense | null {
  // Extract amount — supports "$12", "$12.50", "12 dollars", just "12"
  const amountMatch = input.match(
    /\$\s?(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks?|usd)?/i
  );

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1] || amountMatch[2]);
  if (isNaN(amount) || amount <= 0) return null;

  // Clean description: remove the amount part
  let description = input
    .replace(/\$\s?\d+(?:\.\d{1,2})?/, "")
    .replace(/\d+(?:\.\d{1,2})?\s*(?:dollars?|bucks?|usd)/i, "")
    .replace(/^[\s,.\-:]+|[\s,.\-:]+$/g, "")
    .replace(/\b(?:spent|paid|bought|got|received|earned|made)\b/gi, "")
    .replace(/\b(?:on|for|at|from|to)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // Detect if it's income
  const incomeWords = ["received", "earned", "salary", "paycheck", "income", "refund", "bonus", "got paid", "made"];
  const isIncome = incomeWords.some((word) => input.toLowerCase().includes(word));

  // Auto-categorize
  const category = categorizeExpense(input);

  return {
    amount,
    description: description || "Miscellaneous",
    category,
    type: isIncome ? "income" : "expense",
  };
}

function categorizeExpense(input: string): CategoryType {
  const lowerInput = input.toLowerCase();

  let bestCategory: CategoryType = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;

    let score = 0;
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword)) {
        score += keyword.length; // longer keyword matches have higher weight
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as CategoryType;
    }
  }

  return bestCategory;
}
