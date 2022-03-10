import '@testing-library/jest-dom';
import React from 'react';
import moment from 'moment';
import {
  render, screen,
} from '@testing-library/react';
import selectEvent from 'react-select-event';
import fetchMock from 'fetch-mock';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import userEvent from '@testing-library/user-event';
import CreateGoal from '../index';

describe('create goal', () => {
  const match = {
    path: '',
    url: '',
    params: {
      goalId: 'new',
    },
  };

  const defaultRecipient = {
    id: 1,
    grants: [
      {
        id: 1,
        numberWithProgramTypes: 'Turtle 1',
      },
      {
        id: 2,
        numberWithProgramTypes: 'Turtle 2',
      },
    ],
  };

  const postResponse = [{
    id: 64175,
    name: 'This is goal text',
    status: 'Draft',
    endDate: '2023-08-15',
    isFromSmartsheetTtaPlan: false,
    timeframe: null,
    createdAt: '2022-03-09T19:20:45.818Z',
    updatedAt: '2022-03-09T19:20:45.818Z',
    grants: [{ value: 1, label: 'Turtle 1' }],
    recipientId: 1,
    regionId: 1,
  }];

  function renderForm(recipient = defaultRecipient) {
    const history = createMemoryHistory();
    render((
      <Router history={history}>
        <CreateGoal
          match={match}
          recipient={recipient}
          regionId="1"
        />
      </Router>
    ));
  }

  beforeEach(async () => {
    fetchMock.restore();
  });

  it('you can create a goal', async () => {
    fetchMock.post('/api/goals', postResponse);

    renderForm();

    await screen.findByRole('heading', { name: 'Goal summary' });
    expect(fetchMock.called()).toBe(false);

    const saveDraft = await screen.findByRole('button', { name: /save draft/i });
    userEvent.click(saveDraft);

    expect(fetchMock.called()).toBe(false);

    const goalText = await screen.findByRole('textbox', { name: 'Goal' });
    userEvent.type(goalText, 'This is goal text');

    const ed = await screen.findByRole('textbox', { name: /goal end date/i });
    userEvent.type(ed, '08/15/2023');

    const save = await screen.findByRole('button', { name: /save and continue/i });
    userEvent.click(save);

    // validate grant number
    await screen.findByText('Please select at least one recipient grant');

    const combo = await screen.findByLabelText(/Recipient grant numbers/i);
    await selectEvent.select(combo, ['Turtle 1']);

    const cancel = await screen.findByRole('link', { name: 'Cancel' });

    userEvent.click(save);

    expect(fetchMock.called()).toBeTruthy();

    // restore our fetch mock
    fetchMock.restore();
    expect(fetchMock.called()).toBe(false);
    fetchMock.post('/api/goals', postResponse);

    await screen.findByText(`Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`);

    expect(cancel).not.toBeVisible();

    const submit = await screen.findByRole('button', { name: /submit goal/i });
    userEvent.click(submit);
    expect(fetchMock.called()).toBeTruthy();
  });

  it('goals are validated', async () => {
    fetchMock.post('/api/goals', postResponse);

    const recipient = {
      id: 2,
      grants: [
        {
          id: 2,
          numberWithProgramTypes: 'Turtle 2',
        },
      ],
    };
    renderForm(recipient);

    await screen.findByRole('heading', { name: 'Goal summary' });
    expect(fetchMock.called()).toBe(false);

    // saving drafts works
    const saveDraft = await screen.findByRole('button', { name: /save draft/i });
    userEvent.click(saveDraft);
    expect(fetchMock.called()).toBe(true);

    // reset fetch mock state
    fetchMock.restore();
    fetchMock.post('/api/goals', postResponse);

    const save = await screen.findByRole('button', { name: /save and continue/i });
    userEvent.click(save);

    expect(fetchMock.called()).toBe(false);

    await screen.findByText('Please enter a goal name');

    const goalText = await screen.findByRole('textbox', { name: 'Goal' });
    userEvent.type(goalText, 'This is goal text');

    const ed = await screen.findByRole('textbox', { name: /goal end date/i });
    userEvent.type(ed, 'apple season');

    userEvent.click(save);

    await screen.findByText('Please valid date in the format mm/dd/yyyy');

    userEvent.type(ed, '08/15/2023');

    expect(fetchMock.called()).toBe(false);

    userEvent.click(save);

    expect(fetchMock.called()).toBeTruthy();

    // restore our fetch mock
    fetchMock.restore();
    expect(fetchMock.called()).toBe(false);
    fetchMock.post('/api/goals', postResponse);

    const submit = await screen.findByRole('button', { name: /submit goal/i });
    userEvent.click(submit);
    expect(fetchMock.called()).toBeTruthy();
  });

  it('handles failures to save data', async () => {
    const recipient = {
      id: 2,
      grants: [
        {
          id: 2,
          numberWithProgramTypes: 'Turtle 2',
        },
      ],
    };
    renderForm(recipient);

    fetchMock.post('/api/goals', 500);
    expect(fetchMock.called()).toBe(false);

    const goalText = await screen.findByRole('textbox', { name: 'Goal' });
    userEvent.type(goalText, 'This is goal text');

    const save = await screen.findByRole('button', { name: /save and continue/i });
    userEvent.click(save);

    const draft = await screen.findByRole('button', { name: /save draft/i });
    userEvent.click(draft);

    let alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('There was an error saving your goal');

    fetchMock.restore();
    fetchMock.post('/api/goals', postResponse);
    userEvent.click(save);

    alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(`Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`);

    fetchMock.restore();
    fetchMock.post('/api/goals', 500);

    const submit = await screen.findByRole('button', { name: /submit goal/i });
    userEvent.click(submit);

    alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('There was an error saving your goal');
  });

  it('you can create more than one goal', async () => {
    fetchMock.post('/api/goals', postResponse);

    const recipient = {
      id: 2,
      grants: [
        {
          id: 2,
          numberWithProgramTypes: 'Turtle 2',
        },
      ],
    };
    renderForm(recipient);

    await screen.findByRole('heading', { name: 'Goal summary' });
    expect(fetchMock.called()).toBe(false);

    let goalText = await screen.findByRole('textbox', { name: 'Goal' });
    userEvent.type(goalText, 'This is goal text');

    const cancel = await screen.findByRole('link', { name: 'Cancel' });
    let save = await screen.findByRole('button', { name: /save and continue/i });
    userEvent.click(save);

    expect(fetchMock.called()).toBeTruthy();

    // restore our fetch mock
    fetchMock.restore();
    expect(fetchMock.called()).toBe(false);
    fetchMock.post('/api/goals', postResponse);

    await screen.findByText(`Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`);
    expect(cancel).not.toBeVisible();

    const another = await screen.findByRole('button', { name: 'Add another goal' });
    userEvent.click(another);

    await screen.findByRole('button', { name: /cancel/i });

    goalText = await screen.findByRole('textbox', { name: 'Goal' });
    userEvent.type(goalText, 'This is more goal text');

    save = await screen.findByRole('button', { name: /save and continue/i });
    userEvent.click(save);

    const submit = await screen.findByRole('button', { name: /submit goal/i });
    userEvent.click(submit);
    expect(fetchMock.called()).toBeTruthy();
  });
});
