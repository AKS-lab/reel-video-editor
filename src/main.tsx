import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { installGlobalErrorHandlers } from './error/errorRecovery';
import { seedDemoProjects } from './state/projectStore';
import { logInfo } from './debug/debugLog';

installGlobalErrorHandlers();
seedDemoProjects();
logInfo('ReelCreator bootstrap');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
