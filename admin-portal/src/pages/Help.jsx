import { useState } from 'react';

const FAQs = [
  {
    category: 'Host Moderation',
    questions: [
      { q: 'How long does host verification take?', a: 'Typically verified within 24-48 business hours after checking safety documentation, operating licenses, and identity proofs.' },
      { q: 'What qualifies a listing to be rejected?', a: 'Lack of medical gear information, unsafe terrain, incomplete host identity verification, or missing emergency protocols.' }
    ]
  },
  {
    category: 'Disputes & Refunds',
    questions: [
      { q: 'How does the Wildvora refund logic work?', a: 'If cancelled by operator: 100% refund. If cancelled by customer: depends on the cancellation tier (Flexible/Moderate/Strict) as defined in the listing details.' },
      { q: 'What is the dispute resolution timeframe?', a: 'Disputes raised by customers or operators are locked for 5 business days for administrative arbitration. Admins can override the payout release during this period.' }
    ]
  },
  {
    category: 'Payout Configurations',
    questions: [
      { q: 'When are payments disbursed to hosts?', a: 'Payouts are cleared every Tuesday at 12:00 PM IST for all bookings completed in the prior week (Monday-Sunday), minus Wildvora service fees.' },
      { q: 'What is the default Wildvora commission?', a: 'We charge a flat 12% commission on base experiences. Equipment rentals and custom logistics may carry different tier fees.' }
    ]
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  // Flatten FAQs for search
  const allFAQs = FAQs.flatMap((cat) =>
    cat.questions.map((q) => ({ ...q, category: cat.category }))
  );

  const filteredFAQs = allFAQs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-8 py-8 flex flex-col font-sans max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Help & Documentation</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Search internal guides, policies, and system operation protocols.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search FAQs & docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#1A5F45] focus:border-[#1A5F45] shadow-sm transition"
          />
          <svg className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50/55 transition"
                    >
                      <div>
                        <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-[#1A5F45] border border-emerald-100/50 mb-1.5">{faq.category}</span>
                        <h4 className="text-sm font-bold text-gray-900">{faq.q}</h4>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs text-gray-600 border-t border-gray-50 leading-relaxed bg-gray-50/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl">
                <p className="text-gray-400 text-sm">No documents found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Guides */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 font-sans">Resources & Tools</h2>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1A5F45] flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Platform Guidelines</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Read standard safety operational guidelines mandated for hosts offering water rafting and high-altitude climbs.</p>
              </div>
              <a href="#" className="text-xs font-bold text-[#1A5F45] hover:underline flex items-center gap-1 mt-1">
                Download PDF (3.2 MB)
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
