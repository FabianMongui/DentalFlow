import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/Tooltip.tsx';
import App from './App.tsx';
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
);
