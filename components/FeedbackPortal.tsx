
import React from 'react';
import { Feedback } from '../types';
import { MessageCircle, User, Calendar } from 'lucide-react';

interface FeedbackPortalProps {
  feedback: Feedback[];
  onAdd: (content: string, authorType: Feedback['authorType']) => void;
  lang: 'EN' | 'UR';
}

const FeedbackPortal: React.FC<FeedbackPortalProps> = ({ feedback, onAdd, lang }) => {
  const [content, setContent] = React.useState('');
  const [authorType, setAuthorType] = React.useState<Feedback['authorType']>('Community Member');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd(content, authorType);
    setContent('');
  };

  const t = {
    title: lang === 'EN' ? 'Community Feedback' : 'عوامی رائے',
    subtitle: lang === 'EN' ? 'Share your thoughts and suggestions with UNICEF Pakistan.' : 'یونیسف پاکستان کے ساتھ اپنی تجاویز اور خیالات شیئر کریں۔',
    label: lang === 'EN' ? 'I am a...' : 'میں ایک ہوں...',
    placeholder: lang === 'EN' ? 'Write your feedback here...' : 'اپنی رائے یہاں لکھیں...',
    submit: lang === 'EN' ? 'Share Feedback' : 'رائے بھیجیں',
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-500 mb-8">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">{t.label}</label>
            <div className="flex flex-wrap gap-3">
              {['Parent', 'Teacher', 'Student', 'Community Member'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAuthorType(type as any)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    authorType === type 
                      ? 'bg-[#00ADEF] text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <textarea
            required
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all min-h-[150px] bg-slate-50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.placeholder}
          />

          <button
            type="submit"
            className="w-full md:w-auto bg-[#00ADEF] text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            {t.submit}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedback.map((f) => (
          <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-cyan-100 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-cyan-50 text-[#00ADEF] rounded-full text-xs font-bold uppercase">
                <User size={12} />
                {f.authorType}
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Calendar size={12} />
                {new Date(f.timestamp).toLocaleDateString()}
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed italic">"{f.content}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPortal;
