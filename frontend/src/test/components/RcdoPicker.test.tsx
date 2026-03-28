import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RcdoPicker } from '../../components/RcdoPicker';
import { useStore } from '../../store/useStore';
import { mockRcdoTree } from '../mocks/handlers';

describe('RcdoPicker', () => {
  beforeEach(() => {
    // Pre-populate the store with RCDO tree so it doesn't trigger fetch
    useStore.setState({
      rcdoTree: mockRcdoTree,
      loadingRcdo: false,
    });
  });

  it('renders rally cry names', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);
    expect(screen.getByText('Rally Cry 1')).toBeInTheDocument();
  });

  it('expands rally cry to show objectives on click', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);

    // Objectives should not be visible initially
    expect(screen.queryByText('Objective 1')).not.toBeInTheDocument();

    // Click rally cry to expand
    fireEvent.click(screen.getByText('Rally Cry 1'));

    expect(screen.getByText('Objective 1')).toBeInTheDocument();
  });

  it('expands objective to show outcomes', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);

    // Expand rally cry
    fireEvent.click(screen.getByText('Rally Cry 1'));
    // Expand objective
    fireEvent.click(screen.getByText('Objective 1'));

    expect(screen.getByText('Outcome 1')).toBeInTheDocument();
    expect(screen.getByText('Outcome 2')).toBeInTheDocument();
  });

  it('calls onChange when an outcome is selected', () => {
    const onChange = vi.fn();
    render(<RcdoPicker value="" onChange={onChange} />);

    // Expand rally cry, then objective
    fireEvent.click(screen.getByText('Rally Cry 1'));
    fireEvent.click(screen.getByText('Objective 1'));

    // Click an outcome
    fireEvent.click(screen.getByText('Outcome 1'));

    expect(onChange).toHaveBeenCalledWith('out-1');
  });

  it('highlights suggested outcome with AI match label', () => {
    render(<RcdoPicker value="" onChange={() => {}} suggestedOutcomeId="out-1" />);

    // The suggestedOutcomeId auto-expands the tree
    expect(screen.getByText('Outcome 1')).toBeInTheDocument();
    expect(screen.getByText('AI match')).toBeInTheDocument();
  });

  it('shows loading state when loadingRcdo is true', () => {
    useStore.setState({ rcdoTree: [], loadingRcdo: true });

    render(<RcdoPicker value="" onChange={() => {}} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
