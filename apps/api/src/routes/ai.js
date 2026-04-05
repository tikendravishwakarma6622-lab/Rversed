const { Router } = require('express');
const aiAgent = require('../services/aiAgent');

const router = Router();

/**
 * POST /api/ai/chat — Chat with AI agent
 */
router.post('/chat', async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const response = await aiAgent.chat(user.id, message, context || {});
    return res.json({ message: response.response, source: response.source, tokensUsed: response.tokensUsed });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'ai_error' });
  }
});

/**
 * POST /api/ai/recommend-method — Get payment method recommendation
 */
router.post('/recommend-method', async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const { amountCents } = req.body;
  if (!amountCents) return res.status(400).json({ error: 'amountCents required' });

  try {
    const recommendation = await aiAgent.getPaymentMethodRecommendation(
      user.id,
      amountCents,
      user.region || 'US'
    );
    return res.json({ recommendation });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'recommendation_error' });
  }
});

/**
 * POST /api/ai/analyze-fraud — Get AI explanation of fraud alert
 */
router.post('/analyze-fraud', async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const { fraudAnalysis, transaction } = req.body;
  if (!fraudAnalysis || !transaction) return res.status(400).json({ error: 'missing_data' });

  try {
    const analysis = await aiAgent.analyzeFraudAlert(fraudAnalysis, transaction);
    return res.json({ analysis });
  } catch (err) {
    console.error('Fraud analysis error:', err);
    return res.status(500).json({ error: 'analysis_error' });
  }
});

module.exports = router;
