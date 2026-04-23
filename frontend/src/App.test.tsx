import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders title (Phase 1)', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /map pins/i })).toBeInTheDocument();
  });
});
