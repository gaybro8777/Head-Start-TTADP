/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import Submitter from '../index';
import { REPORT_STATUSES } from '../../../../../../Constants';

const RenderSubmitter = ({
  // eslint-disable-next-line react/prop-types
  submitted, onFormSubmit, formData, pages,
}) => {
  const hookForm = useForm({
    mode: 'onChange',
    defaultValues: formData,
  });

  return (
    <FormProvider {...hookForm}>
      <Submitter
        submitted={submitted}
        onFormSubmit={onFormSubmit}
        approvers={[{ name: 'test', id: 1 }]}
        formData={formData}
        pages={pages}
      />
    </FormProvider>
  );
};

const completePages = [{
  label: 'label',
  state: 'Complete',
  review: false,
}];

const incompletePages = [{
  label: 'incomplete',
  state: 'In progress',
  review: false,
}];

const renderReview = (status, submitted, onFormSubmit, complete = true) => {
  const formData = {
    approvingManager: { name: 'name' },
    approvingManagerId: 1,
    status,
  };

  const pages = complete ? completePages : incompletePages;

  render(
    <RenderSubmitter
      submitted={submitted}
      onFormSubmit={onFormSubmit}
      formData={formData}
      pages={pages}
    />,
  );
};

describe('Submitter review page', () => {
  describe('when the report is a draft', () => {
    it('displays the draft review component', async () => {
      renderReview(REPORT_STATUSES.DRAFT, false, () => {});
      expect(await screen.findByText('Submit Report')).toBeVisible();
    });

    it('allows the author to submit for review', async () => {
      const mockSubmit = jest.fn();
      renderReview(REPORT_STATUSES.DRAFT, false, mockSubmit);
      const button = await screen.findByRole('button');
      userEvent.click(button);
      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    });

    it('displays an error if the report is not complete', async () => {
      renderReview(REPORT_STATUSES.DRAFT, false, () => {}, false);
      const alert = await screen.findByTestId('alert');
      expect(alert.textContent).toContain('Incomplete report');
    });

    it('shows pages that are not completed', async () => {
      renderReview(REPORT_STATUSES.DRAFT, false, () => {}, false);
      const alert = await screen.findByText('Incomplete report');
      expect(alert).toBeVisible();
    });

    it('fails to submit if there are pages that have not been completed', async () => {
      const mockSubmit = jest.fn();
      renderReview(REPORT_STATUSES.DRAFT, false, mockSubmit, false);
      const button = await screen.findByRole('button');
      userEvent.click(button);
      await waitFor(() => expect(mockSubmit).not.toHaveBeenCalled());
    });

    it('displays success if the report has been submitted', async () => {
      renderReview(REPORT_STATUSES.DRAFT, true, () => {});
      const alert = await screen.findByTestId('alert');
      expect(alert.textContent).toContain('Success');
    });
  });

  describe('when the report is approved', () => {
    it('displays the approved component', async () => {
      renderReview(REPORT_STATUSES.APPROVED, false, () => {});
      expect(await screen.findByText('Report approved')).toBeVisible();
    });
  });

  describe('when the report needs action', () => {
    it('displays the needs action component', async () => {
      renderReview(REPORT_STATUSES.NEEDS_ACTION, false, () => {});
      expect(await screen.findByText('Review and re-submit report')).toBeVisible();
    });

    it('shows pages that are not completed', async () => {
      renderReview(REPORT_STATUSES.NEEDS_ACTION, false, () => {}, false);
      const alert = await screen.findByText('Incomplete report');
      expect(alert).toBeVisible();
    });

    it('fails to re-submit if there are pages that have not been completed', async () => {
      const mockSubmit = jest.fn();
      renderReview(REPORT_STATUSES.NEEDS_ACTION, false, mockSubmit, false);
      const button = await screen.findByRole('button');
      userEvent.click(button);
      await waitFor(() => expect(mockSubmit).not.toHaveBeenCalled());
    });

    it('allows the user to resubmit the report', async () => {
      const mockSubmit = jest.fn();
      renderReview(REPORT_STATUSES.NEEDS_ACTION, false, mockSubmit);
      const button = await screen.findByRole('button');
      userEvent.click(button);
      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    });
  });
});