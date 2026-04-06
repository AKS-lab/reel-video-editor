import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppSettingsProvider } from './state/AppSettings';
import { RecoveryBanner } from './components/RecoveryBanner';
import { HomePage } from './pages/HomePage';
import { NewProjectPage } from './pages/NewProjectPage';
import { NarrationPage } from './pages/NarrationPage';
import { PreviewPage } from './pages/PreviewPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App(): JSX.Element {
  return (
    <AppSettingsProvider>
      <BrowserRouter>
        <RecoveryBanner />
        <div className="app-shell">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/project/new" element={<NewProjectPage />} />
              <Route path="/narration" element={<NarrationPage />} />
              <Route path="/preview" element={<PreviewPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppSettingsProvider>
  );
}
