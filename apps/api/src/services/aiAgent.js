let openai = null;

try {
  const OpenAI = require('openai').default;
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch {
  // openai package not installed — AI features will use fallback responses
}

const SYSTEM_PROMPT = `You are xez, an intelligent financial assistant for Rversed — a fintech platform for payments, invoicing, and Bitcoin purchases.

Your responsibilities:
1. Help users understand payment methods (card, ACH, bank-link, UnionPay)
2. Explain fraud checks and KYC requirements clearly
3. Provide smart transaction recommendations based on user history
4. Answer questions about Bitcoin, pricing, and wallet security
5. Assist with technical issues (connection, payment failures)
6. Recommend best payment method for user's region and situation
7. Help with invoicing, withdrawals, and account management

Personality:
- Conversational and helpful, with subtle wit
- Never judgmental about financial decisions
- Empathetic when explaining compliance requirements
- Clear and educational without being patronizing

Always:
- Be concise and friendly
- Explain financial/compliance concepts simply
- Never ask for passwords, private keys, or sensitive data
- Direct complex issues to support@rversed.app
- Celebrate verified users — they're trusted

Current platform capabilities:
- Real-time BTC pricing via CoinGecko
- Multi-region support: US, Canada, China
- Payments via Stripe, Plaid, and Adyen
- 3-step KYC verification (email, identity, address)
- Intelligent fraud detection with adaptive scoring
- Professional invoicing with tax calculation
- Instant withdrawals for verified users`;

// Built-in responses for common questions when AI not configured
const FALLBACK_RESPONSES = {
  payment: "Rversed supports credit/debit cards, ACH bank transfers (US), and bank linking via Plaid. Card payments are instant with a 2.9% fee. ACH is cheaper at $0.25 but takes 1-2 days. For the best experience, link your bank account through Plaid for instant, free transfers.",
  kyc: "Verification is a 3-step process: 1) Verify your email with a 6-digit code, 2) Complete identity verification with a government ID via Stripe Identity, 3) Address verification happens automatically from your ID. Full verification unlocks higher limits and instant withdrawals.",
  bitcoin: "You can buy Bitcoin on Rversed with any supported payment method. We fetch real-time prices from CoinGecko and charge a 0.5% transaction fee. Your BTC is sent to the wallet address you provide. Always double-check your wallet address before confirming!",
  invoice: "You can create professional invoices from the Invoices page. Add line items with quantities and prices, set a tax rate, and send to your clients. Invoices can be tracked as draft, sent, or paid. You can also delete unpaid invoices.",
  fraud: "Rversed uses adaptive risk scoring to protect your account. Every transaction is analyzed for unusual patterns. If a transaction is flagged, it may be held for manual review (usually resolved within 24 hours). Verified accounts with good history get faster approvals.",
  withdrawal: "Verified users can withdraw funds instantly. Go to your dashboard and initiate a withdrawal with your bank account details. Stripe processes the payout, and you'll see the funds in your account within 1-2 business days.",
  default: "I'm xez, your Rversed AI assistant! I can help with payments, Bitcoin purchases, invoicing, KYC verification, fraud questions, and account management. What would you like to know?",
};

function getFallbackResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('payment') || lower.includes('pay') || lower.includes('card') || lower.includes('ach')) return FALLBACK_RESPONSES.payment;
  if (lower.includes('kyc') || lower.includes('verif') || lower.includes('identity')) return FALLBACK_RESPONSES.kyc;
  if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('crypto') || lower.includes('buy')) return FALLBACK_RESPONSES.bitcoin;
  if (lower.includes('invoice') || lower.includes('billing')) return FALLBACK_RESPONSES.invoice;
  if (lower.includes('fraud') || lower.includes('block') || lower.includes('flagged') || lower.includes('suspicious')) return FALLBACK_RESPONSES.fraud;
  if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('cash out')) return FALLBACK_RESPONSES.withdrawal;
  return FALLBACK_RESPONSES.default;
}

async function chat(userId, message, context = {}) {
  if (!openai) {
    return {
      response: getFallbackResponse(message),
      source: 'built-in',
    };
  }

  try {
    const contextMessage = buildContextMessage(userId, context);
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content;
    logConversation(userId, message, aiResponse);

    return {
      response: aiResponse,
      source: 'openai',
      tokensUsed: response.usage.total_tokens,
    };
  } catch (err) {
    console.error('AI chat error:', err);
    return {
      response: getFallbackResponse(message),
      source: 'fallback-error',
    };
  }
}

function buildContextMessage(userId, context) {
  const db = require('../db/inMemoryDb');
  const user = db.findUserById(userId);
  const userTxs = (db.transactions || []).filter(t => t.userId === userId);
  const completed = userTxs.filter(t => t.status === 'completed').length;

  let contextStr = `[User Context]\n`;
  if (user) {
    contextStr += `- Email: ${user.email}\n`;
    contextStr += `- Region: ${user.region || 'Unknown'}\n`;
    contextStr += `- Verified: ${user.isVerified ? 'Yes' : 'No'}\n`;
    contextStr += `- Identity Verified: ${user.identityVerified ? 'Yes' : 'No'}\n`;
    contextStr += `- Transactions: ${completed} completed\n`;
    contextStr += `- Balance: $${((user.balanceCents || 0) / 100).toFixed(2)}\n`;
  }

  if (context.lastTransaction) {
    contextStr += `- Last transaction status: ${context.lastTransaction.status}\n`;
    contextStr += `- Last amount: $${(context.lastTransaction.amountCents / 100).toFixed(2)}\n`;
  }

  if (context.fraudAlert) {
    contextStr += `- Recent fraud check: Score ${context.fraudAlert.fraudScore}, Recommendation: ${context.fraudAlert.recommendation}\n`;
  }

  return contextStr;
}

async function getPaymentMethodRecommendation(userId, amountCents, region) {
  if (!openai) {
    // Smart fallback based on region and amount
    if (region === 'CN') return 'UnionPay is recommended for your region. Fast processing with competitive fees.';
    if (amountCents > 100000) return 'For larger purchases, ACH bank transfer offers the lowest fees at just $0.25 per transaction.';
    if (amountCents < 5000) return 'Card payment is quickest for smaller amounts. Instant confirmation with 2.9% fee.';
    return 'Link your bank via Plaid for the best experience — instant transfers with no fees.';
  }

  try {
    const db = require('../db/inMemoryDb');
    const user = db.findUserById(userId);
    const userTxs = (db.transactions || []).filter(t => t.userId === userId);

    const prompt = `User in ${region} wants to buy $${(amountCents / 100).toFixed(2)} of Bitcoin.
    User history: ${userTxs.length} transactions, verified: ${user?.isVerified ? 'yes' : 'no'}.
    Available methods: Card (2.9% fee), ACH ($0.25, 1-2 days), Bank-link via Plaid (instant, free).
    Recommend the best option with 1-2 sentences.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 100,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('Recommendation error:', err);
    return null;
  }
}

async function analyzeFraudAlert(fraudAnalysis, transaction) {
  if (!openai) {
    // Built-in fraud analysis
    const score = fraudAnalysis.fraudScore || 0;
    const threshold = fraudAnalysis.threshold || 70;
    if (score < threshold * 0.5) return `Your transaction looks clean with a low risk score of ${score}. No issues detected — you're good to go!`;
    if (score < threshold) return `Your transaction has a moderate risk score of ${score}/${threshold}. This is within normal range but may take a moment longer to process.`;
    return `Your transaction was flagged with a risk score of ${score}/${threshold}. This is usually due to unusual patterns. Our team will review it within 24 hours. Contact support@rversed.app if you need help.`;
  }

  try {
    const prompt = `Analyze this fraud alert for a Bitcoin purchase:
Score: ${fraudAnalysis.fraudScore}/${fraudAnalysis.threshold}
Risk Level: ${fraudAnalysis.riskLevel}
Amount: $${(transaction.amountCents / 100).toFixed(2)}
Flags: ${(fraudAnalysis.flags || []).map(f => f.type).join(', ')}
Recommendation: ${fraudAnalysis.recommendation}
Provide a brief explanation (2-3 sentences) of why this score and what the user should do.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 150,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('Fraud analysis error:', err);
    return null;
  }
}

function logConversation(userId, userMessage, aiResponse) {
  const db = require('../db/inMemoryDb');
  if (!db.aiConversations) db.aiConversations = [];
  db.aiConversations.push({
    id: require('uuid').v4(),
    userId,
    userMessage,
    aiResponse,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  chat,
  getPaymentMethodRecommendation,
  analyzeFraudAlert,
};
