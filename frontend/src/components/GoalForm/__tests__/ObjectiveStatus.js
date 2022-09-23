import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';
import {
  render, screen,
} from '@testing-library/react';
import ObjectiveStatus from '../ObjectiveStatus';

describe('ObjectiveStatus', () => {
  it('shows the dropdown', async () => {
    const onChangeStatus = jest.fn();

    render(<ObjectiveStatus
      status="In Progress"
      goalStatus="In Progress"
      onChangeStatus={onChangeStatus}
      inputName="objective-status"
      isOnReport={false}
    />);

    const dropdown = await screen.findByLabelText('Objective status');
    expect(dropdown).toBeVisible();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);

    userEvent.selectOptions(dropdown, 'Completed');
    expect(onChangeStatus).toHaveBeenCalledWith('Completed');
  });

  it('shows the correct options for completed', async () => {
    const onChangeStatus = jest.fn();

    render(<ObjectiveStatus
      status="Completed"
      goalStatus="In Progress"
      onChangeStatus={onChangeStatus}
      inputName="objective-status"
      isOnReport={false}
    />);

    const dropdown = await screen.findByLabelText('Objective status');
    expect(dropdown).toBeVisible();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
  });

  it('shows the read only view when the goal is closed', async () => {
    const onChangeStatus = jest.fn();

    render(<ObjectiveStatus
      status="Completed"
      goalStatus="Closed"
      onChangeStatus={onChangeStatus}
      inputName="objective-status"
      isOnReport={false}
    />);

    const label = await screen.findByText('Objective status');

    expect(label).toBeVisible();
    expect(label.tagName).toEqual('P');

    expect(document.querySelector('select')).toBe(null);
  });
});
