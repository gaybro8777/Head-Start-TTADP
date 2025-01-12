import '@testing-library/jest-dom';
import React from 'react';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import RegionalSelect from '../RegionalSelect';

const renderRegionalSelect = (
  onApplyRegion = jest.fn(),
  hasCentralOffice = true,
  appliedRegion = 14,
) => {
  const history = createMemoryHistory();

  render(
    <Router history={history}>
      <RegionalSelect
        appliedRegion={appliedRegion}
        regions={[1, 2]}
        onApply={onApplyRegion}
        hasCentralOffice={hasCentralOffice}
      />
    </Router>,
  );
  return history;
};

describe('Regional Select', () => {
  test('displays correct region in input', async () => {
    const onApplyRegion = jest.fn();
    renderRegionalSelect(onApplyRegion);
    const button = screen.getByRole('button', { name: 'toggle regional select menu' });
    expect(button.textContent).toBe('All regions');
  });

  test('changes input value on apply', async () => {
    const onApplyRegion = jest.fn();
    renderRegionalSelect(onApplyRegion, false, 1);
    const button = screen.getByRole('button', { name: /toggle regional select menu/i });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button', {
      name: /select to view data from region 2\. select apply filters button to apply selection/i,
    }));

    const applyButton = screen.getByRole('button', { name: 'Apply filters for the regional select menu' });
    fireEvent.click(applyButton);

    expect(onApplyRegion).toHaveBeenCalled();
  });
});
