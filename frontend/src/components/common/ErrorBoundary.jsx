import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Something Went Wrong</h2>
          <p className="text-xs text-neutral-400 max-w-xs mt-2 leading-relaxed">
            An unexpected error occurred. Try refreshing the page or clearing your browser cache.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 bg-[#FF6B00] hover:bg-[#e05e00] text-white py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
