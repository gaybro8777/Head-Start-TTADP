import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import fetchMock from 'fetch-mock';
import join from 'url-join';
import selectEvent from 'react-select-event';

import ReviewSubmit from '../ReviewSubmit';

const renderReview = (allComplete, submitted, initialData = {}, onSubmit = () => {}) => {
  render(<ReviewSubmit
    allComplete={allComplete}
    submitted={submitted}
    initialData={initialData}
    onSubmit={onSubmit}
    reviewItems={[]}
  />);
};

const approvers = [
  { id: 1, name: 'user 1' },
  { id: 2, name: 'user 2' },
];

const selectLabel = 'Manager - you may choose more than one.';

describe('ReviewSubmit', () => {
  afterEach(() => fetchMock.restore());
  beforeEach(() => {
    const approversUrl = join('/', 'api', 'activity-reports', 'approvers');
    fetchMock.get(approversUrl, approvers);
  });

  describe('when the form is not complete', () => {
    it('an error alert is shown', async () => {
      renderReview(false, false);
      const alert = await screen.findByTestId('alert');
      expect(alert).toHaveClass('usa-alert--error');
      await waitFor(() => expect(screen.getByLabelText(selectLabel)).toBeEnabled());
    });

    it('the submit button is disabled', async () => {
      renderReview(false, false);
      const button = await screen.findByRole('button');
      expect(button).toBeDisabled();
      await waitFor(() => expect(screen.getByLabelText(selectLabel)).toBeEnabled());
    });
  });

  describe('when the form is complete', () => {
    it('no modal is shown', async () => {
      renderReview(true, false);
      const alert = screen.queryByTestId('alert');
      expect(alert).toBeNull();
      await waitFor(() => expect(screen.getByLabelText(selectLabel)).toBeEnabled());
    });

    it('the submit button is disabled until one approver is selected', async () => {
      renderReview(true, false);
      const button = await screen.findByRole('button');
      expect(button).toBeDisabled();
      await selectEvent.select(screen.getByLabelText(selectLabel), ['user 1']);
      expect(await screen.findByRole('button')).toBeEnabled();
    });
  });

  it('a success modal is shown once submitted', async () => {
    renderReview(true, true);
    const alert = await screen.findByTestId('alert');
    expect(alert).toHaveClass('usa-alert--success');
  });

  it('initializes the form with "initialData"', async () => {
    renderReview(true, true, { additionalNotes: 'test' });
    const textBox = await screen.findByLabelText('Additional notes for this activity (optional)');
    await waitFor(() => expect(textBox).toHaveValue('test'));
  });
});