
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { SchoolIssue, IssueCategory, Province } from '../types';
import { Brain, TrendingUp, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { analyzeGaps } from '../services/geminiService';
import { Feedback } from '../types';

interface DashboardProps {
  issues: SchoolIssue[];
  feedback: Feedback[];
  lang: 'EN' | 'UR';
}

const COLORS = ['#00ADEF', '#FFD700', '#F43F5E', '#10B981', '#6366F1'];

const Dashboard: React.FC<DashboardProps> = ({ issues, feedback, lang }) => {
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);

  const stats = [
    { label: 'Total Reports', value: issues.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Critical Gaps', value: issues.filter(i => i.severity === 'Critical').length, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Resolved', value: issues.filter(i => i.status === 'Resolved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const categoryData = Object.values(IssueCategory).map(cat => ({
    name: cat,
    value: issues.filter(i => i.category === cat).length
  }));

  const provinceData = Object.values(Province).map(prov => ({
    name: prov,
    count: issues.filter(i => i.province === prov).length
  }));

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeGaps(issues, feedback);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Issue Distribution by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Province Breakdown */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Reports by Province</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#00ADEF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <Brain size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Data Analyst</h2>
              <p className="text-white/80">Get instant insights from reported data and community feedback.</p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loadingAnalysis}
            className="bg-white text-[#00ADEF] px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingAnalysis ? 'Thinking...' : 'Generate Insights'}
          </button>
        </div>

        {analysis && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-medium leading-relaxed">
              {analysis}
            </div>
          </div>
        )}
      </div>

      {/* Recent Issues List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Recent Reported Issues</h3>
          <button className="text-[#00ADEF] font-semibold text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">School</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Province</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.slice(0, 5).map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="font-semibold text-slate-800">{issue.schoolName}</div>
                    <div className="text-xs text-slate-500">EMIS: {issue.emisCode}</div>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-600">{issue.category}</td>
                  <td className="px-8 py-4 text-sm text-slate-600">{issue.province}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      issue.severity === 'Critical' ? 'bg-rose-100 text-rose-600' :
                      issue.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                      issue.severity === 'Medium' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${
                      issue.status === 'Resolved' ? 'text-emerald-600' :
                      issue.status === 'In Progress' ? 'text-amber-600' :
                      'text-slate-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        issue.status === 'Resolved' ? 'bg-emerald-500' :
                        issue.status === 'In Progress' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`} />
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
