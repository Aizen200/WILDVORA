import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Load Google Fonts Material Symbols dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I update my listing prices for peak season?",
      answer: "To update your pricing, navigate to the 'Listings' tab, select the specific experience, and go to the 'Pricing' section. You can set date-range specific rates for weekends, holidays, or seasonal peak periods."
    },
    {
      question: "When will I receive my payout for completed trips?",
      answer: "Payouts are typically processed 24-48 hours after the scheduled experience is completed. Funds usually arrive in your bank account within 3-5 business days depending on your financial institution."
    },
    {
      question: "What is the policy for guest cancellations within 24 hours?",
      answer: "Our standard policy grants operators a 50% payout for cancellations made within 24 hours of the start time. You can customize your specific cancellation flexibility in your listing settings under 'Policies'."
    },
    {
      question: "Can I add multiple guide accounts to one listing?",
      answer: "Yes! You can manage your team by going to 'Settings' > 'Team Management'. There you can invite other guides and assign them to specific listings with varying levels of access permissions."
    }
  ];

  return (
    <Layout>
      <div id="support-page" className="max-w-6xl mx-auto space-y-12 pb-12">
        
        {/* Hero Search Section */}
        <section className="text-center space-y-6 pt-4">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">How can we help you today?</h2>
          <div className="max-w-2xl mx-auto relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-5 pl-14 bg-white rounded-2xl border-none shadow-[0_8px_30px_0_rgba(45,55,72,0.12)] text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none transition-all group-hover:scale-[1.01]"
              placeholder="Describe your issue (e.g., 'updating payout details')"
            />
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-3xl">
              search
            </span>
          </div>
        </section>

        {/* Help Categories (Bento Style) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] hover:scale-[1.02] transition-all duration-200 cursor-pointer group border border-gray-100/50">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Bookings</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Cancellations, modifications, and reservation history.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] hover:scale-[1.02] transition-all duration-200 cursor-pointer group border border-gray-100/50">
            <div className="w-12 h-12 bg-[#0a6687]/10 rounded-xl flex items-center justify-center text-[#0a6687] mb-4 group-hover:bg-[#0a6687] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Payments</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Payout schedules, taxes, and bank account settings.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] hover:scale-[1.02] transition-all duration-200 cursor-pointer group border border-gray-100/50">
            <div className="w-12 h-12 bg-[#6e583f]/10 rounded-xl flex items-center justify-center text-[#6e583f] mb-4 group-hover:bg-[#6e583f] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[26px]">edit_note</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Listings</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Photos, pricing strategies, and equipment lists.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] hover:scale-[1.02] transition-all duration-200 cursor-pointer group border border-gray-100/50">
            <div className="w-12 h-12 bg-[#ba1a1a]/10 rounded-xl flex items-center justify-center text-[#ba1a1a] mb-4 group-hover:bg-[#ba1a1a] group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[26px]">verified_user</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Safety &amp; Trust</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Insurance, guide certification, and guest verification.</p>
          </div>
        </section>

        {/* Contact Options & FAQ Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-primary p-6 rounded-2xl text-white shadow-[0_8px_30px_0_rgba(45,55,72,0.18)] relative overflow-hidden">
              {/* Decorative Texture */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <h2 className="text-2xl font-bold mb-2">Need expert help?</h2>
              <p className="text-xs opacity-90 mb-6 leading-relaxed">Our dedicated support team is available 24/7 to assist with your outdoor operations.</p>
              <div className="space-y-3 relative z-10">
                <button onClick={() => setShowChat(true)} className="w-full py-3 bg-white text-primary rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#a3f3cd]/30 transition-colors shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                  Live Chat
                </button>
                <a href="mailto:support@wildvora.com" className="w-full py-3 border border-white/40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors no-underline hover:no-underline">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Email Us
                </a>
                <button onClick={() => alert('Call scheduling system is offline. Please email support@wildvora.com.')} className="w-full py-3 border border-white/40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Schedule a Call
                </button>
              </div>
            </div>
            <div className="p-5 bg-[#EEF6F1] rounded-2xl border border-gray-100 shadow-[0_4px_20px_0_rgba(45,55,72,0.05)]">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Average Response Times</h4>
              <ul className="space-y-2">
                <li className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Live Chat</span>
                  <span className="font-bold text-gray-800">&lt; 2 mins</span>
                </li>
                <li className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Email</span>
                  <span className="font-bold text-gray-800">4-6 hours</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_0_rgba(45,55,72,0.06)] overflow-hidden transition-all duration-200">
                    <button
                      className="w-full p-5 flex justify-between items-center text-left hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleFaq(idx)}
                    >
                      <span className="text-sm font-semibold text-gray-850">{faq.question}</span>
                      <span className={`material-symbols-outlined transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-gray-500 leading-relaxed font-medium border-t border-gray-50 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center pt-2">
              <button className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                View all 150+ articles
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Community/Slack Section */}
        <section className="relative h-[260px] rounded-2xl overflow-hidden flex items-center px-10 shadow-[0_8px_30px_0_rgba(45,55,72,0.15)]">
          <div className="absolute inset-0 z-0">
            <img
              alt="Wildvora Guide Community"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4LDRmCnWq7qK_WuMvUPTEj72b6pGng1stelAv68lerrWgP6hd43uoH39nHDwOcxgqpFiPd4cKBl6pdeIouVCJOqcubq4noljXP-7JykIBOLcosaQ38Q57Vs8Blm1iW1zc2meTdnNNqkgndK5fOYQ5WataMDu_fgrYcKn-dDdDkLdoZAD8mQQK4iW2VPdeu3d0wR6aDVC_14iNbg_pw5JzTLtf-tsizMXQU3lc6MJQcxzNfmDTtqAaVO1YuPgpX6d109lZo4YFdYw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-lg space-y-4 text-white">
            <h3 className="text-2xl font-bold leading-tight">Join the Wildvora Operator Community</h3>
            <p className="text-sm opacity-80 leading-relaxed">Connect with over 2,000 professional guides, share best practices, and get exclusive industry insights.</p>
            <button onClick={() => window.open('https://slack.com', '_blank')} className="px-5 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-md cursor-pointer">
              Join Slack Workspace
            </button>
          </div>
        </section>

        {/* Live Chat Modal Popup */}
        {showChat && (
          <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-150 overflow-hidden z-50 flex flex-col">
            <div className="bg-[#1A5F45] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-450 rounded-full bg-emerald-400" />
                <span className="font-bold text-sm">Wildvora Support Agent</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200 transition text-sm font-bold">✕</button>
            </div>
            <div className="p-4 h-48 overflow-y-auto space-y-3 bg-gray-50 flex flex-col justify-end text-xs font-semibold">
              <div className="bg-white border border-gray-100 rounded-xl p-3 text-gray-700 max-w-[85%] self-start leading-relaxed shadow-sm">
                Hello! Thanks for reaching out to Wildvora support. How can we help you manage your adventure listings or payouts today?
              </div>
            </div>
            <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#1A5F45]" />
              <button onClick={() => alert('Demo mode: Messages cannot be sent.')} className="bg-[#1A5F45] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#145038] transition">Send</button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
