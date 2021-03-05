/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import topics from '../topicsResources';

// eslint-disable-next-line react/prop-types
const RenderTopicsResourcesReview = ({ data }) => {
  const history = createMemoryHistory();
  const hookForm = useForm({
    mode: 'onChange',
    defaultValues: data,
  });
  // eslint-disable-next-line react/prop-types
  return (
    <Router history={history}>
      <FormProvider {...hookForm}>
        {topics.reviewSection()}
      </FormProvider>
    </Router>
  );
};

describe('Topics & resources', () => {
  const data = {
    otherResources: [{ originalFileName: 'other', url: { url: 'http://localhost/other' }, status: 'APPROVED' }],
    attachments: [{ originalFileName: 'attachment', url: { url: 'http://localhost/attachment' }, status: 'APPROVED' }],
    resourcesUsed: 'resources',
    topics: 'topics',
  };

  describe('review page', () => {
    it('displays attachments and other resources', async () => {
      render(<RenderTopicsResourcesReview data={data} />);
      expect(await screen.findByText('other')).toBeVisible();
      expect(await screen.findByText('attachment')).toBeVisible();
      expect(await screen.findByText('resources')).toBeVisible();
      expect(await screen.findByText('topics')).toBeVisible();
    });
  });
});