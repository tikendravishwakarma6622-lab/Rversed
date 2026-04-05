const express = require('express');
const router = express.Router();

// We use a lazy require so this works with both db.js and inMemoryDb.js
function getDb() {
  try { return require('../db/db'); } catch { return require('../db/inMemoryDb'); }
}

// List user's invoices
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const db = getDb();
    const invoices = await db.getUserInvoices(req.user.id);
    res.json({ invoices });
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const db = getDb();
    const invoice = await db.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.userId !== req.user.id && invoice.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { customerName, customerEmail, items, dueDate, notes, taxRate } = req.body;
    if (!customerName) return res.status(400).json({ error: 'Customer name required' });
    if (!items || !items.length) return res.status(400).json({ error: 'At least one item required' });

    const subtotalCents = items.reduce((sum, item) => sum + Math.round((item.quantity || 1) * (item.unitPriceCents || 0)), 0);
    const taxCents = Math.round(subtotalCents * ((taxRate || 0) / 100));
    const totalCents = subtotalCents + taxCents;

    const db = getDb();
    const invoice = await db.createInvoice({
      userId: req.user.id,
      customerName,
      customerEmail: customerEmail || '',
      items,
      subtotalCents,
      taxCents,
      totalCents,
      status: 'draft',
      dueDate: dueDate || null,
      notes: notes || '',
    });

    res.status(201).json({ invoice });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const db = getDb();
    const existing = await db.getInvoiceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.userId !== req.user.id && existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { customerName, customerEmail, items, dueDate, notes, taxRate } = req.body;
    const patch = {};
    if (customerName) patch.customerName = customerName;
    if (customerEmail !== undefined) patch.customerEmail = customerEmail;
    if (notes !== undefined) patch.notes = notes;
    if (dueDate !== undefined) patch.dueDate = dueDate;
    if (items) {
      patch.items = items;
      patch.subtotalCents = items.reduce((sum, item) => sum + Math.round((item.quantity || 1) * (item.unitPriceCents || 0)), 0);
      patch.taxCents = Math.round(patch.subtotalCents * ((taxRate || 0) / 100));
      patch.totalCents = patch.subtotalCents + patch.taxCents;
    }

    const invoice = await db.updateInvoice(req.params.id, patch);
    res.json({ invoice });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Send invoice (change status to sent)
router.post('/:id/send', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const db = getDb();
    const existing = await db.getInvoiceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.userId !== req.user.id && existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const invoice = await db.updateInvoice(req.params.id, { status: 'sent' });
    res.json({ invoice, message: 'Invoice sent successfully' });
  } catch (err) {
    console.error('Send invoice error:', err);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// Mark as paid
router.post('/:id/pay', async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.getInvoiceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = await db.updateInvoice(req.params.id, { status: 'paid', paidAt: new Date().toISOString() });
    res.json({ invoice });
  } catch (err) {
    console.error('Pay invoice error:', err);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const db = getDb();
    const existing = await db.getInvoiceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.userId !== req.user.id && existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (existing.status === 'paid') return res.status(400).json({ error: 'Cannot delete paid invoice' });

    await db.deleteInvoice(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
