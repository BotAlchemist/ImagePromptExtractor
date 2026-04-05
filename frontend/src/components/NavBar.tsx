import { Link, useLocation } from 'react-router-dom';

interface Props {
  onSignOut: () => void;
  username?: string;
}

export function NavBar({ onSignOut, username }: Props) {
  const { pathname } = useLocation();

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900 text-base tracking-tight">
            Prompt Extractor
          </span>
          <Link to="/" className={linkClass('/')}>
            Extractor
          </Link>
          <Link to="/library" className={linkClass('/library')}>
            Library
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {username && (
            <span className="text-sm text-gray-400 hidden sm:block">{username}</span>
          )}
          <button
            onClick={onSignOut}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
