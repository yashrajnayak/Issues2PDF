import { useState, useRef } from 'react';
import RepoForm from './components/RepoForm';
import IssuesList, { DownloadButtons } from './components/IssuesList';
import { Issue, GitHubCredentials } from './types';
import { fetchIssues } from './services/github';
import { Github } from 'lucide-react';
import { generateAllIssuesPDF } from './services/pdf';

function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [hideMetadata, setHideMetadata] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const issueRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSubmit = async (credentials: GitHubCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedIssues = await fetchIssues(credentials);
      setIssues(fetchedIssues);
      setRepoInfo(credentials.repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const openIssues = issues.filter(issue => issue.state === 'open');
  const closedIssues = issues.filter(issue => issue.state === 'closed');
  const currentIssues = activeTab === 'open' ? openIssues : closedIssues;

  const handleDownloadAll = async () => {
    try {
      const validRefs = issueRefs.current.filter(ref => ref !== null) as HTMLDivElement[];
      await generateAllIssuesPDF(
        validRefs,
        currentIssues,
        hideMetadata,
        () => {}
      );
    } catch (error) {
      console.error('Error downloading all issues:', error);
      alert('Failed to download all issues as PDF');
    }
  };

  const handleDownloadSelected = async () => {
    try {
      const selectedRefs = Array.from(selectedIssues)
        .map(index => issueRefs.current[index])
        .filter(ref => ref !== null) as HTMLDivElement[];
      const selectedIssuesList = Array.from(selectedIssues).map(index => currentIssues[index]);

      if (selectedRefs.length === 0) {
        alert('Please select at least one issue to download');
        return;
      }
      
      await generateAllIssuesPDF(
        selectedRefs,
        selectedIssuesList,
        hideMetadata,
        () => {}
      );
    } catch (error) {
      console.error('Error downloading selected issues:', error);
      alert('Failed to download selected issues as PDF');
    }
  };

  const handleRegisterRef = (element: HTMLDivElement | null, index: number) => {
    issueRefs.current[index] = element;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center">
            <Github size={32} className="mr-3" />
            Issues2PDF
          </h1>
        </div>

        <RepoForm onSubmit={handleSubmit} loading={loading} />
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {repoInfo && (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              <Github size={20} className="mr-2" />
              {repoInfo}
            </h2>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={hideMetadata}
                  onChange={(e) => setHideMetadata(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span>Hide metadata</span>
              </label>
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'open'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setActiveTab('open')}
                >
                  Open Issues ({openIssues.length})
                </button>
                <button
                  className={`px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'closed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setActiveTab('closed')}
                >
                  Closed Issues ({closedIssues.length})
                </button>
              </div>
              <DownloadButtons
                onDownloadSelected={handleDownloadSelected}
                onDownloadAll={handleDownloadAll}
                selectedCount={selectedIssues.size}
              />
            </div>
          </div>
        )}
        
        {repoInfo && <IssuesList 
          issues={currentIssues}
          loading={loading}
          hideMetadata={hideMetadata}
          onRegisterRef={handleRegisterRef}
          onToggleSelect={(index) => {
            setSelectedIssues(prev => {
              const newSet = new Set(prev);
              if (newSet.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              return newSet;
            });
          }}
          selectedIssues={selectedIssues}
        />}
      </main>
      
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>
            Project by{' '}
            <a 
              href="https://github.com/yashrajnayak" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Yashraj Nayak
            </a>
            {' '}|{' '}
            <a 
              href="https://github.com/yashrajnayak/Issues2PDF" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;