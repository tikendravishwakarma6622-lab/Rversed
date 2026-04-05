import React, { useEffect, useState } from 'react';
import api from '../services/api';

const statusColors = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function InvoiceForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial || {
    customerName: '', customerEmail: '', dueDate: '', notes: '', taxRate: 0,
    items: [{ description: '', quantity: 1, unitPriceCents: 0 }],
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const setItem = (idx, key) => (e) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: key === 'description' ? e.target.value : Number(e.target.value) };
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPriceCents: 0 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (i.quantity || 1) * (i.unitPriceCents || 0), 0);
  const tax = Math.round(subtotal * (form.taxRate / 100));
  const total = subtotal + tax;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, subtotalCents: subtotal, taxCents: tax, totalCents: total });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-6 animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer name</label>
          <input required value={form.customerName} onChange={set('customerName')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer email</label>
          <input type="email" value={form.customerEmail} onChange={set('customerEmail')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due date</label>
          <input type="date" value={form.dueDate} onChange={set('dueDate')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tax rate (%)</label>
          <input type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={set('taxRate')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors" />
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Line items</label>
        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <div className="flex-1">
                {idx === 0 && <span className="text-xs text-gray-500 dark:text-gray-400">Description</span>}
                <input required value={item.description} onChange={setItem(idx, 'description')}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" placeholder="Service or product" />
              </div>
              <div className="w-20">
                {idx === 0 && <span className="text-xs text-gray-500 dark:text-gray-400">Qty</span>}
                <input type="number" min="1" value={item.quantity} onChange={setItem(idx, 'quantity')}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
              </div>
              <div className="w-32">
                {idx === 0 && <span className="text-xs text-gray-500 dark:text-gray-400">Price (cents)</span>}
                <input type="number" min="0" value={item.unitPriceCents} onChange={setItem(idx, 'unitPriceCents')}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
              </div>
              <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5">
                ${((item.quantity || 1) * (item.unitPriceCents || 0) / 100).toFixed(2)}
              </div>
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add item
        </button>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="font-medium text-gray-900 dark:text-white">${(subtotal / 100).toFixed(2)}</span></div>
        {form.taxRate > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tax ({form.taxRate}%)</span><span className="font-medium text-gray-900 dark:text-white">${(tax / 100).toFixed(2)}</span></div>}
        <div className="flex justify-between text-base font-bold"><span className="text-gray-900 dark:text-white">Total</span><span className="text-brand-600">${(total / 100).toFixed(2)}</span></div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={2}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" placeholder="Payment terms, thank you note..." />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-colors">Save Invoice</button>
      </div>
    </form>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.getInvoices()
      .then(data => setInvoices(data.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    try {
      await api.createInvoice(data);
      setShowForm(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSend = async (id) => {
    try {
      await api.sendInvoice(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteInvoice(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const fmt = (cents) => '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage invoices for your clients.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Invoice
          </button>
        </div>

        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {showForm ? (
          <InvoiceForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        ) : invoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No invoices yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first invoice to start getting paid.</p>
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors">Create Invoice</button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Invoice</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Due</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">{inv.invoiceNumber || inv.invoice_number || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{inv.customerName || inv.customer_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{inv.customerEmail || inv.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{fmt(inv.totalCents || inv.total_cents)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[inv.status] || statusColors.draft}`}>{inv.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.dueDate || inv.due_date ? new Date(inv.dueDate || inv.due_date).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {inv.status === 'draft' && (
                          <button onClick={() => handleSend(inv.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Send</button>
                        )}
                        {inv.status !== 'paid' && (
                          <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
