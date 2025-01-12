import '@testing-library/jest-dom';
import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import UnusedData from '../UnusedData';

describe('UnusedData', () => {
  it('shows the read only view', async () => {
    render(<UnusedData
      key="key"
      value="value"
    />);

    expect(await screen.findByText('value')).toBeVisible();
    expect(document.querySelector('svg')).toBeTruthy();
    expect(document.querySelector('a')).toBe(null);
  });

  it('shows a link when it is supposed to', async () => {
    render(<UnusedData
      key="key"
      value="value"
      isLink
    />);

    expect(await screen.findByText('value')).toBeVisible();
    expect(document.querySelector('svg')).toBeTruthy();
    expect(document.querySelector('a')).toBeTruthy();
  });
});
