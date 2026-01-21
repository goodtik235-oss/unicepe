
import React from 'react';
import { Province, IssueCategory, SchoolIssue } from '../types';
import { Send, AlertCircle } from 'lucide-react';

interface IssueFormProps {
  onSubmit: (issue: Omit<SchoolIssue, 'id' | 'reportedAt' | 'status'>) => void;
  lang: 'EN' | 'UR';
}

const IssueForm: React.FC<IssueFormProps> = ({ onSubmit, lang }) => {
  const [formData, setFormData] = React.useState({
    schoolName: '',
    emisCode: '',
    province: Province.PUNJAB,
    district: '',
    category: IssueCategory.INFRASTRUCTURE,
    description: '',
    severity: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      schoolName: '',
      emisCode: '',
      province: Province.PUNJAB,
      district: '',
      category: IssueCategory.INFRASTRUCTURE,
      description: '',
      severity: 'Medium',
    });
  };

  const t = {
    title: lang === 'EN' ? 'Report School Issue' : 'اسکول کا مسئلہ رپورٹ کریں',
    schoolName: lang === 'EN' ? 'School Name' : 'اسکول کا نام',
    emisCode: lang === 'EN' ? 'EMIS Code' : 'ایم آئی ایس کوڈ',
    province: lang === 'EN' ? 'Province' : 'صوبہ',
    district: lang === 'EN' ? 'District' : 'ضلع',
    category: lang === 'EN' ? 'Category' : 'زمرہ',
    description: lang === 'EN' ? 'Describe the issue' : 'مسئلے کی تفصیل بیان کریں',
    severity: lang === 'EN' ? 'Severity Level' : 'شدت کی سطح',
    submit: lang === 'EN' ? 'Submit Report' : 'رپورٹ جمع کرائیں',
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 text-[#00ADEF]">
        <AlertCircle size={28} />
        <h2 className="text-2xl font-bold">{t.title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.schoolName}</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.schoolName}
            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
            placeholder="e.g. GPS Model Town"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.emisCode}</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.emisCode}
            onChange={(e) => setFormData({ ...formData, emisCode: e.target.value })}
            placeholder="7-digit EMIS code"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.province}</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value as Province })}
          >
            {Object.values(Province).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.district}</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            placeholder="e.g. Quetta"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.category}</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
          >
            {Object.values(IssueCategory).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.severity}</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
          >
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-slate-700">{t.description}</label>
          <textarea
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00ADEF] outline-none transition-all min-h-[120px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Please provide details about the gap or problem..."
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full md:w-auto bg-[#00ADEF] text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            {t.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;
