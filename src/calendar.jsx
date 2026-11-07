// Compliance calendar page only: a React island inside the static site. main.js still runs the shell.
import { createRoot } from 'react-dom/client';
import './styles/calendar.css';
import App from './calendar/App.jsx';

createRoot(document.getElementById('cc-root')).render(<App />);
