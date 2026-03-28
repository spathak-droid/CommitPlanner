import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChessBadge } from '../../components/ChessBadge';

describe('ChessBadge', () => {
  it('renders Must Do label for MUST_DO priority', () => {
    render(<ChessBadge priority="MUST_DO" />);
    expect(screen.getByText(/Must Do/)).toBeInTheDocument();
  });

  it('renders Should Do label for SHOULD_DO priority', () => {
    render(<ChessBadge priority="SHOULD_DO" />);
    expect(screen.getByText(/Should Do/)).toBeInTheDocument();
  });

  it('renders Nice to Do label for NICE_TO_DO priority', () => {
    render(<ChessBadge priority="NICE_TO_DO" />);
    expect(screen.getByText(/Nice to Do/)).toBeInTheDocument();
  });

  it('includes chess letter prefix A for MUST_DO', () => {
    render(<ChessBadge priority="MUST_DO" />);
    expect(screen.getByText('A \u00b7 Must Do')).toBeInTheDocument();
  });

  it('includes chess letter prefix B for SHOULD_DO', () => {
    render(<ChessBadge priority="SHOULD_DO" />);
    expect(screen.getByText('B \u00b7 Should Do')).toBeInTheDocument();
  });

  it('includes chess letter prefix C for NICE_TO_DO', () => {
    render(<ChessBadge priority="NICE_TO_DO" />);
    expect(screen.getByText('C \u00b7 Nice to Do')).toBeInTheDocument();
  });
});
