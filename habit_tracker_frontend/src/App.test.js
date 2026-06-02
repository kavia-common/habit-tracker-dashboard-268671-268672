import {render, screen} from '@testing-library/react';
import App from './App';

test('renders Habit Tracker shell', () => {
    render(<App />);
    const title = screen.getByText('Habit Tracker');
    expect(title).toBeInTheDocument();
});
