import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

/** @return {void} */
function bootstrap() {
    const root = createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

bootstrap();
