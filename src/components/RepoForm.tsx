import React, { useState } from 'react';
import { GitHubCredentials } from '../types';
import { Github, Key } from 'lucide-react';

interface RepoFormProps {
  onSubmit: (credentials: GitHubCredentials) => void;
  loading: boolean;
}

const RepoForm: React.FC<RepoFormProps> = ({ onSubmit, loading }) => {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!repo) {
      setError('Repository name is required');
      return;
    }

    if (!token) {
      setError('GitHub token is required');
      return;
    }

    if (!repo.includes('/')) {
      setError('Repository must be in format: username/repository');
      return;
    }

    onSubmit({ repo, token });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">GitHub Issues to PDF</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1">
            Repository (username/repository)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Github size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="repo"
              placeholder="e.g. facebook/react"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Personal Access Token
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              id="token"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Needs permissions: public_repo (for public repos) or repo (for private repos)
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
              Fetching Issues...
            </>
          ) : (
            'Fetch Issues'
          )}
        </button>
      </form>
    </div>
  );
};

export default RepoForm;