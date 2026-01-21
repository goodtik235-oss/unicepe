
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IssueForm from './components/IssueForm';
import FeedbackPortal from './components/FeedbackPortal';
import ImpactSection from './components/ImpactSection';
import { AppState, SchoolIssue, Feedback } from './types';
import { INITIAL_ISSUES, INITIAL_FEEDBACK } from './constants';

const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>({
    issues: INITIAL_ISSUES,
    feedback: INITIAL_FEEDBACK,
    language: 'EN'
  });

  const [activeTab, setActiveTab] = React.useState('dashboard');

  const handleAddIssue = (issueData: Omit<SchoolIssue, 'id' | 'reportedAt' | 'status'>) => {
    const newIssue: SchoolIssue = {
      ...issueData,
      id: Math.random().toString(36).substr(2, 9),
      reportedAt: new Date().toISOString().split('T')[0],
      status: 'Reported'
    };
    setState(prev => ({
      ...prev,
      issues: [newIssue, ...prev.issues]
    }));
    setActiveTab('dashboard');
  };

  const handleAddFeedback = (content: string, authorType: Feedback['authorType']) => {
    const newFeedback: Feedback = {
      id: Math.random().toString(36).substr(2, 9),
      authorType,
      content,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      feedback: [newFeedback, ...prev.feedback]
    }));
  };

  const toggleLanguage = () => {
    setState(prev => ({
      ...prev,
      language: prev.language === 'EN' ? 'UR' : 'EN'
    }));
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      lang={state.language}
      toggleLang={toggleLanguage}
    >
      <div dir={state.language === 'UR' ? 'rtl' : 'ltr'} className={state.language === 'UR' ? 'font-urdu' : ''}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            issues={state.issues} 
            feedback={state.feedback} 
            lang={state.language}
          />
        )}
        {activeTab === 'report' && (
          <IssueForm 
            onSubmit={handleAddIssue} 
            lang={state.language} 
          />
        )}
        {activeTab === 'feedback' && (
          <FeedbackPortal 
            feedback={state.feedback} 
            onAdd={handleAddFeedback} 
            lang={state.language} 
          />
        )}
        {activeTab === 'impact' && (
          <ImpactSection 
            lang={state.language} 
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
