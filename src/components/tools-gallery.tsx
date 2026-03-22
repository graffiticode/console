import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR from 'swr';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { selectLanguages } from './language-selector';
import { countItems } from '../utils/swr/fetchers';
import SignIn from './SignIn';
import { getTitle } from '../lib/utils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ToolsGallery({ language, setLanguage }) {
  const { user } = useGraffiticodeAuth();
  const router = useRouter();
  const queryDomain = router.query.domain;
  const queryDomainStr = Array.isArray(queryDomain) ? queryDomain[0] : queryDomain;
  const storedDomain = typeof window !== 'undefined' ? sessionStorage.getItem('graffiticode:domain') : null;
  const domain = queryDomainStr || storedDomain || getTitle();
  const languages = selectLanguages(domain);

  const [selectedLang, setSelectedLang] = useState<string | null>(language?.name || null);
  const selectedLangRef = useRef(selectedLang);
  selectedLangRef.current = selectedLang;

  // Sync tool selection to global language when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      if (selectedLangRef.current) {
        setLanguage({ name: selectedLangRef.current });
      }
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, setLanguage]);

  const langItemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const langListRef = useRef<HTMLUListElement>(null);
  const [isLangPanelCollapsed, setIsLangPanelCollapsed] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:tools:langPanelCollapsed') === 'true'
  );

  // Auto-focus the list when languages are available
  useEffect(() => {
    if (languages.length > 0 && langListRef.current) {
      langListRef.current.focus();
    }
  }, [languages.length > 0]);

  const { data: itemCounts } = useSWR(
    user ? { user, langs: languages } : null,
    countItems,
  );

  const toggleLangPanel = useCallback(() => {
    const newState = !isLangPanelCollapsed;
    setIsLangPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:tools:langPanelCollapsed', newState.toString());
    }
  }, [isLangPanelCollapsed]);

  const handleSelectLanguage = (lang) => {
    setSelectedLang(lang.name);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <SignIn label="Sign in to continue" />
        <p className="mt-4 text-sm text-gray-600 text-center max-w-sm">
          New here? Create a free account by signing in with an Ethereum wallet. No blockchain fees required.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <div className="flex grow w-full overflow-hidden">
        {/* Languages panel */}
        <div className={classNames(
          "flex-none transition-all duration-300 border border-gray-200 rounded-none mr-1",
          isLangPanelCollapsed ? "w-10" : "w-[210px]",
          isLangPanelCollapsed ? "h-10" : "h-[calc(100vh-90px)]"
        )}>
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <span className={classNames(
              "text-sm font-medium text-gray-700",
              isLangPanelCollapsed && "hidden"
            )}>Tools</span>
            <button
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              title={isLangPanelCollapsed ? "Expand tools panel" : "Collapse tools panel"}
              onClick={toggleLangPanel}>
              {isLangPanelCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>
          {!isLangPanelCollapsed && (
            <div className="h-[calc(100%-42px)] overflow-auto">
              {languages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">No languages found</div>
                </div>
              ) : (
                <nav className="flex flex-1 flex-col bg-gray-100 pt-1 pr-2">
                  <ul
                    ref={langListRef}
                    role="list"
                    className="space-y-1 focus:outline-none"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const currentIndex = languages.findIndex(l => l.name === selectedLang);
                        const nextIndex = currentIndex + (e.key === 'ArrowUp' ? -1 : 1);
                        if (nextIndex >= 0 && nextIndex < languages.length) {
                          const nextLang = languages[nextIndex];
                          handleSelectLanguage(nextLang);
                          langItemRefs.current[nextLang.name]?.scrollIntoView({ block: 'nearest' });
                        }
                      }
                    }}
                  >
                    {languages.map((lang) => (
                      <li key={lang.name} ref={(el) => { langItemRefs.current[lang.name] = el; }}>
                        <button
                          onClick={() => { handleSelectLanguage(lang); langListRef.current?.focus(); }}
                          className={classNames(
                            selectedLang === lang.name ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200',
                            "flex flex-col w-full text-left rounded-none py-1 pl-4 pr-2 focus:outline-none"
                          )}
                        >
                          <span className="text-xs font-bold text-gray-700">{lang.name}</span>
                          <span className="text-xs text-gray-500 truncate">{lang.description}</span>
                          <span className="text-xs text-gray-400">{itemCounts && itemCounts[lang.name] || "0"} items</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
        {/* Spacer */}
        <div className="w-1 ml-1" />
        {/* Main content area */}
        <div className="flex flex-col grow border border-gray-200 rounded-none h-[calc(100vh-90px)]">
          {selectedLang ? (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-gray-800">{selectedLang}</h2>
                <Link
                  href="/items"
                  onClick={() => setLanguage({ name: selectedLang })}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-none"
                >
                  Edit Items
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {languages.find(l => l.name === selectedLang)?.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {itemCounts && itemCounts[selectedLang] || "0"} items
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Select a tool</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
