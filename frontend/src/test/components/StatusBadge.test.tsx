import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders DRAFT label', () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('renders LOCKED label', () => {
    render(<StatusBadge status="LOCKED" />);
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });

  it('renders RECONCILING label', () => {
    render(<StatusBadge status="RECONCILING" />);
    expect(screen.getByText('RECONCILING')).toBeInTheDocument();
  });

  it('renders RECONCILED label', () => {
    render(<StatusBadge status="RECONCILED" />);
    expect(screen.getByText('RECONCILED')).toBeInTheDocument();
  });

  it('renders CARRY FWD label for CARRY_FORWARD status', () => {
    render(<StatusBadge status="CARRY_FORWARD" />);
    expect(screen.getByText('CARRY FWD')).toBeInTheDocument();
  });

  it('renders NO PLAN label for NO_PLAN status', () => {
    render(<StatusBadge status="NO_PLAN" />);
    expect(screen.getByText('NO PLAN')).toBeInTheDocument();
  });
});
