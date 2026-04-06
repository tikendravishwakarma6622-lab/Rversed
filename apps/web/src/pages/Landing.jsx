import React from 'react';
import { Link } from 'react-router-dom';

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-xl transition-all duration-300 group">
      <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 group-hover:scale-110 transition-all duration-300" dangerouslySetInnerHTML={{ __html: icon }}></div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, company }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic mb-6">"{quote}"</p>
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{role}, {company}</div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, desc, features, popular }) {
  return (
    <div className={`rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl ${popular ? 'bg-brand-600 border-brand-500 text-white scale-105 shadow-xl shadow-brand-600/25' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
      {popular && <div className="text-xs font-semibold bg-white/20 inline-flex px-3 py-1 rounded-full mb-4">Most Popular</div>}
      <h3 className={`text-xl font-bold mb-1 ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{name}</h3>
      <p className={`text-sm mb-4 ${popular ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'}`}>{desc}</p>
      <div className="mb-6">
        <span className={`text-4xl font-extrabold ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{price}</span>
        {price !== 'Custom' && <span className={`text-sm ml-1 ${popular ? 'text-brand-200' : 'text-gray-400'}`}>/month</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${popular ? 'text-brand-200' : 'text-brand-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className={popular ? 'text-brand-50' : 'text-gray-600 dark:text-gray-400'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/register" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${popular ? 'bg-white text-brand-600 hover:bg-gray-50' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
        Get Started
      </Link>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <span className="text-2xl font-bold text-brand-600 tracking-tight">Rversed</span>
        <div className="flex items-center gap-4">
          <a href="#features" className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2">Features</a>
          <a href="#pricing" className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2">Pricing</a>
          <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Sign in</Link>
          <Link to="/register" className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fadeIn">
              Now in Beta — Join the waitlist
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight animate-slideUp">
              Finance,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-600">Rversed.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed animate-slideUp" style={{ animationDelay: '0.1s' }}>
              One platform for payments, invoicing, banking, and business management. Built for the next generation of businesses.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <Link to="/register" className="inline-flex items-center px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5">
                Start for Free
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <a href="#features" className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-lg border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5">
                See Features
              </a>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-50 dark:from-brand-950/20 to-transparent -z-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-200 dark:bg-brand-800 rounded-full opacity-20 blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-200 dark:bg-purple-800 rounded-full opacity-10 blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </header>

      {/* Stats */}
      <section className="bg-gray-900 dark:bg-gray-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[['$0', 'Monthly fees'], ['0.5%', 'Transaction fee'], ['150+', 'Countries'], ['24/7', 'AI Support']].map(([val, label]) => (
              <div key={label} className="group">
                <div className="text-3xl sm:text-4xl font-bold text-white group-hover:text-brand-400 transition-colors">{val}</div>
                <div className="mt-1 text-sm text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Everything you need to run your business</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Payments, banking, accounting, and AI — unified in one platform.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon="&#36;" title="Accept Payments" desc="Buy and sell Bitcoin with card or bank transfer. Stripe-powered checkout with real-time conversion rates and instant confirmations." />
            <FeatureCard icon="&#9993;" title="Send Invoices" desc="Create, send, and track professional invoices with line items, tax calculation, and one-click payment. Manage your entire billing workflow." />
            <FeatureCard icon="&#128100;" title="KYC Verification" desc="3-step identity verification powered by Stripe Identity. Email confirmation, government ID check, and address validation — all built in." />
            <FeatureCard icon="&#128200;" title="Dashboard & Analytics" desc="Real-time dashboard with balance tracking, transaction history, spending metrics, and account status — all at a glance." />
            <FeatureCard icon="&#128119;" title="Admin Panel" desc="Full admin console with user management, transaction monitoring, withdrawal oversight, and platform-wide analytics." />
            <FeatureCard icon="&#128737;" title="Fraud Protection" desc="Adaptive risk scoring engine that evaluates every transaction in real time. Automatic blocking of suspicious activity before it costs you." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Get started in minutes</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Three simple steps to transform your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds. No credit card required. Instant access to your dashboard.' },
              { step: '02', title: 'Set Up Business', desc: 'Complete your profile, verify your identity, and configure payment methods.' },
              { step: '03', title: 'Start Earning', desc: 'Accept payments, send invoices, and manage your finances — all in one place.' },
            ].map(s => (
              <div key={s.step} className="text-center group">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 group-hover:scale-110 transition-all duration-300">
                  <span className="text-xl font-bold text-brand-600">{s.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Trusted by businesses everywhere</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">See what early adopters have to say.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard quote="Rversed replaced three different tools we were paying for. The all-in-one approach saves us hours every week." name="Sarah Chen" role="CEO" company="Lightframe Studio" />
            <TestimonialCard quote="The AI assistant is like having a financial advisor on speed dial. It caught a fraud attempt within seconds of it happening." name="Marcus Rivera" role="Founder" company="Rivera Commerce" />
            <TestimonialCard quote="Invoicing alone was worth the switch. Our clients pay 3x faster with Rversed payment links compared to our old system." name="Emily Okafor" role="CFO" company="Nextstep Digital" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">No hidden fees. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            <PricingCard name="Starter" price="$0" desc="For individuals and side projects" features={['Accept payments', 'Basic invoicing', '1 team member', 'Email support', '0.5% transaction fee']} />
            <PricingCard name="Growth" price="$29" desc="For growing businesses" features={['Everything in Starter', 'Advanced analytics', 'Unlimited invoicing', '5 team members', 'Priority support', '0.3% transaction fee', 'AI assistant']} popular />
            <PricingCard name="Enterprise" price="Custom" desc="For large organizations" features={['Everything in Growth', 'Dedicated account manager', 'Custom integrations', 'Unlimited team members', 'SLA guarantee', '0.1% transaction fee', 'On-premise option']} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to reverse the way you do finance?</h2>
          <p className="mt-4 text-lg text-brand-100">Join thousands of businesses building on Rversed.</p>
          <Link to="/register" className="inline-flex items-center mt-8 px-8 py-4 bg-white hover:bg-gray-50 text-brand-600 font-bold rounded-xl text-lg transition-all shadow-lg hover:-translate-y-0.5">
            Create Your Account
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <span className="text-xl font-bold text-white">Rversed</span>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">The future of business finance. Payments, invoicing, banking — all in one.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><span className="text-gray-600">API Docs (coming soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-600">About</span></li>
                <li><span className="text-gray-600">Blog</span></li>
                <li><span className="text-gray-600">Careers</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-600">Privacy Policy</span></li>
                <li><span className="text-gray-600">Terms of Service</span></li>
                <li><span className="text-gray-600">Compliance</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2026 Rversed. All rights reserved.</p>
            <p className="text-xs text-gray-600">Powered by xez AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
