import { Link } from 'react-router-dom';
import { InfiniteProjectList } from '../components/InfiniteProjectList';
import { SearchSuggestions } from '../components/SearchSuggestions';
import { TrendingTemplates } from '../components/TrendingTemplates';
import { PRELOADED_TEMPLATES } from '../templates/genreTemplates';
import { getRecentTemplateIds } from '../state/projectStore';

export function HomePage(): JSX.Element {
  const searchPool = [
    ...PRELOADED_TEMPLATES.map((t) => t.name),
    'gaming',
    'satisfying',
    'story',
    'recent',
    ...getRecentTemplateIds(),
  ];

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <header className="stack" style={{ gap: '0.75rem' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="h1">ReelCreator</h1>
            <p className="muted">Short-form vertical stories for Instagram and YouTube Shorts.</p>
          </div>
          <Link to="/settings" className="btn btn-ghost" aria-label="Open settings">
            Settings
          </Link>
        </div>
        <section aria-label="Top section" className="card stack">
          <SearchSuggestions items={searchPool} placeholder="Search templates & tools…" />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Link to="/project/new" className="btn btn-primary">
              New project
            </Link>
          </div>
        </section>
      </header>

      <InfiniteProjectList />
      <TrendingTemplates />
    </div>
  );
}
