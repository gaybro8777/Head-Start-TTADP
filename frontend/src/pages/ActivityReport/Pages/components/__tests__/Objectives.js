import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form/dist/index.ie11';
import selectEvent from 'react-select-event';
import { REPORT_STATUSES } from '../../../../../Constants';
import Objectives from '../Objectives';

// eslint-disable-next-line react/prop-types
const RenderObjectives = ({ objectiveOptions, goalId = 12, collaborators = [] }) => {
  let goalForEditing = null;

  if (goalId) {
    goalForEditing = {
      id: goalId,
    };
  }

  const hookForm = useForm({
    mode: 'onBlur',
    defaultValues: {
      collaborators,
      author: {
        role: 'Central office',
      },
      goalForEditing,
    },
  });

  const topicOptions = [
    {
      value: 1,
      label: 'Fencing',
    },
    {
      value: 2,
      label: 'Boating',
    },
  ];

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...hookForm}>
      <Objectives
        objectives={objectiveOptions}
        topicOptions={topicOptions}
        roles={['Central office']}
        goalId={goalId}
      />
      <button type="button">blur me</button>
    </FormProvider>
  );
};

describe('Objectives', () => {
  it('you can create a new objective', async () => {
    const objectiveOptions = [];
    const collabs = [{ role: 'Snake charmer' }, { role: 'lion tamer' }];
    render(<RenderObjectives objectiveOptions={objectiveOptions} collaborators={collabs} />);
    const select = await screen.findByLabelText(/Select TTA objective/i);
    expect(screen.queryByText(/objective status/i)).toBeNull();
    await selectEvent.select(select, ['Create a new objective']);
    await waitFor(() => expect(screen.queryByText(/objective status/i)).not.toBeNull());
  });
  it('allows for the selection of an objective', async () => {
    const objectiveOptions = [{
      value: 3,
      label: 'Test objective',
      title: 'Test objective',
      ttaProvided: '<p>hello</p>',
      activityReports: [],
      resources: [],
      topics: [],
      roles: [],
      status: 'Not Started',
    }];
    render(<RenderObjectives objectiveOptions={objectiveOptions} />);
    const select = await screen.findByLabelText(/Select TTA objective/i);
    expect(screen.queryByText(/objective status/i)).toBeNull();
    await selectEvent.select(select, ['Test objective']);

    const r = await screen.findByLabelText(/resource 1/i);
    userEvent.type(r, 'GARG');
    userEvent.click(await screen.findByText(/blur me/i));

    await waitFor(() => expect(screen.queryByText(/objective status/i)).not.toBeNull());
  });
  it('the button adds a new objective', async () => {
    const objectiveOptions = [{
      value: 3,
      label: 'Test objective',
      title: 'Test objective',
      ttaProvided: '<p>hello</p>',
      activityReports: [],
      resources: [],
      topics: [],
      roles: ['CENTRAL OFFICE'],
      status: 'Not Started',
    }];
    render(<RenderObjectives objectiveOptions={objectiveOptions} />);
    const button = await screen.findByRole('button', { name: /Add new objective/i });
    expect(screen.queryByText(/objective status/i)).toBeNull();
    userEvent.click(button);
    await waitFor(() => expect(screen.queryByText(/objective status/i)).not.toBeNull());
  });

  it('is on approved reports hides options', async () => {
    const objectiveOptions = [{
      value: 3,
      label: 'Test objective',
      title: 'Test objective',
      ttaProvided: '<p>hello</p>',
      activityReports: [{
        status: REPORT_STATUSES.APPROVED,
      }],
      resources: [],
      topics: [],
      roles: ['CENTRAL OFFICE'],
      status: 'Not Started',
    }];
    render(<RenderObjectives objectiveOptions={objectiveOptions} />);
    const select = await screen.findByLabelText(/Select TTA objective/i);
    expect(screen.queryByText(/objective status/i)).toBeNull();
    await selectEvent.select(select, ['Test objective']);
    const role = await screen.findByText(/Test objective/i, { ignore: 'div' });
    expect(role.tagName).toBe('P');
  });

  it('handles a "new" goal', async () => {
    const objectiveOptions = [{
      value: 3,
      label: 'Test objective',
      title: 'Test objective',
      ttaProvided: '<p>hello</p>',
      activityReports: [],
      resources: [],
      topics: [],
      roles: ['CENTRAL OFFICE'],
      status: 'Not Started',
    }];
    render(<RenderObjectives objectiveOptions={objectiveOptions} goalId="new" />);
    const button = await screen.findByRole('button', { name: /Add new objective/i });
    expect(screen.queryByText(/objective status/i)).toBeNull();
    userEvent.click(button);
    await waitFor(() => expect(screen.queryByText(/objective status/i)).not.toBeNull());
  });
});
