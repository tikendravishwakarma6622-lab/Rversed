const { Router } = require('express');
const ctrl = require('../controllers/integrations.controller');
const { requireVerified } = require('../middlewares/requireVerified.middleware');

const router = Router();
router.get('/methods', ctrl.getAvailablePaymentMethods);
router.post('/plaid-link-token', ctrl.createPlaidLinkToken);
router.post('/plaid-exchange-token', ctrl.exchangePlaidToken);
router.post('/buy-bitcoin', requireVerified, ctrl.buyBitcoin);

module.exports = router;
