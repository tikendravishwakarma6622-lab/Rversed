const OpenAI = require('openai').default;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * AI Agent with system prompt for rversed
 * Handles: user support, fraud analysis, recommendations, transaction help
 */
const SYSTEM_PROMPT = `You are xez, an intelligent financial assistant for rversed Bitcoin purchases.

Your responsibilities:
1. Help users understand payment methods (card, ACH, bank-link, UnionPay)
2. Explain fraud checks and KYC requirements clearly
3. Provide smart transaction recommendations based on user history
4. Answer questions about Bitcoin, pricing, and wallet security
5. Assist with technical issues (connection, payment failures)
6. Recommend best payment method for user's region and situation
7. Learn from user interactions to give better advice over time

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

Current system capabilities:
- Real-time BTC pricing via CoinGecko
- Multi-region support: US, Canada, China
- Instant payments with Stripe/Plaid/Adyen
- KYC verification for compliance
- Intelligent fraud detection with manual review option`;

/**
 * Chat with AI agent
 */
async function chat(userId, message, context = {}) {
  if (!openai) {
    return {
      response: 'AI agent not configured. Contact support at support@rversed.app',
      source: 'fallback',
    };
  }

  try {
    // Build context from user data
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

    // Log conversation
    logConversation(userId, message, aiResponse);

    return {
      response: aiResponse,
      source: 'openai',
      tokensUsed: response.usage.total_tokens,
    };
  } catch (err) {
    console.error('AI chat error:', err);
    return {
      response: 'I encountered an issue. Please try again or contact support@rversed.app',
      source: 'error',
      error: err.message,
    };
  }
}

/**
 * Build context message from user data
 */
function buildContextMessage(userId, context) {
  const db = require('../db/inMemoryDb');
  const user = db.users.find(u => u.id === userId);
  const userTxs = (db.transactions || []).filter(t => t.userId === userId);
  const completed = userTxs.filter(t => t.status === 'completed').length;

  let contextStr = `[User Context]\n`;
  if (user) {
    contextStr += `- Name: ${user.email}\n`;
    contextStr += `- Region: ${user.region || 'Unknown'}\n`;
    contextStr += `- Verified: ${user.isVerified ? 'Yes' : 'No'}\n`;
    contextStr += `- Transactions: ${completed} completed\n`;
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

/**
 * Get AI recommendations for payment method
 */
async function getPaymentMethodRecommendation(userId, amountCents, region) {
  if (!openai) return null;

  try {
    const db = require('../db/inMemoryDb');
    const user = db.users.find(u => u.id === userId);
    const userTxs = (db.transactions || []).filter(t => t.userId === userId);

    const prompt = `User in ${region} wants to buy $${(amountCents / 100).toFixed(2)} of Bitcoin. 
    User history: ${userTxs.length} transactions, verified: ${user?.isVerified ? 'yes' : 'no'}.
    
    Available methods:
    - Card (Visa/Mastercard/UnionPay): Fast, familiar, 2.9% fee
    - ACH (US only): Cheaper ($0.25), slower (1-2 days)
    - Bank-link via Plaid (US only): Instant, seamless, free
    
    Recommend the best option with 1-2 sentences. Be brief.`;

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

/**
 * Analyze fraud alert with AI
 */
async function analyzeFraudAlert(fraudAnalysis, transaction) {
  if (!openai) return null;

  try {
    const prompt = `Analyze this fraud alert for a Bitcoin purchase:
    
Score: ${fraudAnalysis.fraudScore}/${fraudAnalysis.threshold}
Risk Level: ${fraudAnalysis.riskLevel}
User Tier: ${fraudAnalysis.userTier}
Amount: $${(transaction.amountCents / 100).toFixed(2)}
Flags: ${fraudAnalysis.flags.map(f => f.type).join(', ')}
Recommendation: ${fraudAnalysis.recommendation}

Provide a brief explanation (2-3 sentences) of why this score and what the user should do. Be reassuring if low-risk.`;

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

/**
 * Log conversation for compliance
 */
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
