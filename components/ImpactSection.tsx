
import React from 'react';
import { Target, BarChart3, ShieldCheck, Heart } from 'lucide-react';

const ImpactSection: React.FC<{ lang: 'EN' | 'UR' }> = ({ lang }) => {
  const impactPoints = [
    {
      icon: Target,
      title: lang === 'EN' ? 'Data-Driven Decisions' : 'اعداد و شمار پر مبنی فیصلے',
      desc: lang === 'EN' ? 'Real-time monitoring allows for precise allocation of resources where they are needed most.' : 'ریئل ٹائم مانیٹرنگ وسائل کی وہاں درست تقسیم کی اجازت دیتی ہے جہاں ان کی سب سے زیادہ ضرورت ہوتی ہے۔'
    },
    {
      icon: BarChart3,
      title: lang === 'EN' ? 'Gap Analysis' : 'خلا کا تجزیہ',
      desc: lang === 'EN' ? 'Visualize disparities across different regions to prioritize interventions for marginalized schools.' : 'پسماندہ اسکولوں کے لیے مداخلتوں کو ترجیح دینے کے لیے مختلف علاقوں میں تفاوت کا تصور کریں۔'
    },
    {
      icon: ShieldCheck,
      title: lang === 'EN' ? 'Accountability' : 'احتساب',
      desc: lang === 'EN' ? 'Direct reporting from schools ensures that the ground reality is reaching policymakers directly.' : 'اسکولوں کی براہ راست رپورٹنگ اس بات کو یقینی بناتی ہے کہ زمینی حقیقت براہ راست پالیسی سازوں تک پہنچ رہی ہے۔'
    },
    {
      icon: Heart,
      title: lang === 'EN' ? 'Community Inclusion' : 'کمیونٹی شمولیت',
      desc: lang === 'EN' ? 'Empowering parents and teachers to have a voice in the educational development of their districts.' : 'والدین اور اساتذہ کو اپنے اضلاع کی تعلیمی ترقی میں آواز بلند کرنے کے لیے بااختیار بنانا۔'
    }
  ];

  return (
    <div className="space-y-12 py-8">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          {lang === 'EN' ? 'Revolutionizing Educational Monitoring' : 'تعلیمی نگرانی میں انقلاب'}
        </h2>
        <p className="text-lg text-slate-600">
          {lang === 'EN' ? 'Together with our government partners, we are building a more transparent and equitable education system for every child in Pakistan.' : 'اپنے حکومتی شراکت داروں کے ساتھ مل کر، ہم پاکستان میں ہر بچے کے لیے ایک زیادہ شفاف اور منصفانہ تعلیمی نظام بنا رہے ہیں۔'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {impactPoints.map((point, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex gap-6 hover:shadow-md transition-all group">
            <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#00ADEF] shrink-0 group-hover:scale-110 transition-transform">
              <point.icon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{point.title}</h3>
              <p className="text-slate-600 leading-relaxed">{point.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#00ADEF] rounded-[2.5rem] p-12 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-xl">
          <h3 className="text-3xl font-bold mb-6">Partnering for Results</h3>
          <p className="text-white/90 text-lg mb-8">
            This prototype serves as a bridge between frontline data collection and high-level strategy implementation. By integrating AI analysis, we can predict needs before they become crises.
          </p>
          <div className="flex flex-wrap gap-4">
            <img src="https://picsum.photos/120/40?grayscale" alt="Gov Partner" className="opacity-60 grayscale brightness-200" />
            <img src="https://picsum.photos/120/40?grayscale&v=1" alt="Gov Partner" className="opacity-60 grayscale brightness-200" />
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full translate-y-1/2 translate-x-1/4" />
      </div>
    </div>
  );
};

export default ImpactSection;
