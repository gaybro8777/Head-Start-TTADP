import '@testing-library/jest-dom';
import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatDateRange } from '../../DateRangeSelect';
import FilterItem from '../FilterItem';
import { FILTER_CONFIG } from '../constants';

const selectedTopic = FILTER_CONFIG[0];
const topicOptions = FILTER_CONFIG.map(({ id: filterId, display }) => (
  <option key={filterId} value={filterId}>{display}</option>
));

describe('Filter menu item', () => {
  const renderFilterItem = (
    filter,
    onRemoveFilter = jest.fn(),
    onUpdateFilter = jest.fn(),
    setErrors = jest.fn(),
  ) => {
    const setError = jest.fn((error) => {
      setErrors([error]);
    });

    const validate = jest.fn(() => {
      const { topic, query, condition } = filter;
      let message = '';
      if (!topic) {
        message = 'Please enter a value';
        setError(message);
        return false;
      }
      if (!condition) {
        message = 'Please enter a condition';
        setError(message);
        return false;
      }
      if (!query || !query.length) {
        message = 'Please enter a parameter';
        setError(message);
        return false;
      }
      if (query.includes('Invalid date') || (topic === 'startDate' && query === '-')) {
        message = 'Please enter a parameter';
        setError(message);
        return false;
      }
      setError(message);
      return true;
    });

    render(
      <div>
        <FilterItem
          filter={filter}
          onRemoveFilter={onRemoveFilter}
          onUpdateFilter={onUpdateFilter}
          errors={['']}
          setErrors={setErrors}
          index={0}
          validate={validate}
          key={filter.id}
          topicOptions={topicOptions}
          selectedTopic={selectedTopic}
        />
        <button type="button">BIG DUMB BUTTON</button>
      </div>,
    );
  };

  it('updates topic & condition', async () => {
    const filter = {
      id: 'gibberish', topic: 'startDate', condition: 'Is after', query: '2021/01/01',
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();
    renderFilterItem(filter, onRemove, onUpdate);

    const topic = screen.getByRole('combobox', { name: 'topic' });
    userEvent.selectOptions(topic, 'role');
    expect(onUpdate).toHaveBeenCalledWith('gibberish', 'topic', 'role');

    const condition = screen.getByRole('combobox', { name: 'condition' });
    userEvent.selectOptions(condition, 'Is within');
    expect(onUpdate).toHaveBeenCalledWith('gibberish', 'condition', 'Is within');
  });

  it('displays a date filter correctly', () => {
    const filter = {
      id: 'gibberish', topic: 'startDate', condition: 'Is after', query: '2021/01/01',
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();
    renderFilterItem(filter, onRemove, onUpdate);

    const selector = screen.getByRole('combobox', { name: 'condition' });
    expect(selector).toBeVisible();
    expect(screen.getByRole('textbox', { name: /date/i })).toBeVisible();
  });

  it('applies the proper date range', async () => {
    const filter = {
      id: 'c6d0b3a7-8d51-4265-908a-beaaf16f12d3', topic: 'startDate', condition: 'Is within', query: '2021/01/01-2021/10/28',
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();

    renderFilterItem(filter, onRemove, onUpdate);

    const button = screen.getByRole('button', {
      name: /Toggle the date range select menu/i,
    });

    userEvent.click(button);

    userEvent.click(await screen.findByRole('button', {
      name: /select to view data from custom date range\. select apply filters button to apply selection/i,
    }));

    const sd = screen.getByRole('textbox', { name: /start date/i });
    const ed = screen.getByRole('textbox', { name: /end date/i });

    userEvent.type(sd, '01/01/2021');
    userEvent.type(ed, '01/02/2021');

    userEvent.click(screen.getByRole('button', { name: /apply date range filters/i }));
    expect(onUpdate).toHaveBeenCalledWith('c6d0b3a7-8d51-4265-908a-beaaf16f12d3', 'query', '2021/01/01-2021/01/02');

    userEvent.click(button);

    userEvent.click(screen.getByRole('button', {
      name: /Select to view data from Last 30 Days. Select Apply filters button to apply selection/i,
    }));

    userEvent.click(screen.getByRole('button', { name: /apply date range filters/i }));

    const lastThirtyDays = formatDateRange({
      lastThirtyDays: true,
      forDateTime: true,
    });

    expect(onUpdate).toHaveBeenCalledWith('c6d0b3a7-8d51-4265-908a-beaaf16f12d3', 'query', lastThirtyDays);
  });

  it('validates topic', async () => {
    const filter = {
      id: 'blah-de-dah',
      display: '',
      topic: '',
      condition: '',
      query: [],
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();
    const setErrors = jest.fn();
    renderFilterItem(filter, onRemove, onUpdate, setErrors);
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    expect(setErrors).toHaveBeenCalledWith(['Please enter a value']);
  });

  it('validates condition', async () => {
    const filter = {
      id: 'blah-de-dah',
      display: '',
      topic: 'role',
      condition: '',
      query: [],
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();
    const setErrors = jest.fn();
    renderFilterItem(filter, onRemove, onUpdate, setErrors);
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    expect(setErrors).toHaveBeenCalledWith(['Please enter a condition']);
  });

  it('validates query', async () => {
    const filter = {
      id: 'blah-de-dah',
      display: '',
      topic: 'startDate',
      condition: 'Is within',
      query: '',
    };
    const onRemove = jest.fn();
    const onUpdate = jest.fn();
    const setErrors = jest.fn();
    renderFilterItem(filter, onRemove, onUpdate, setErrors);
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    userEvent.tab();
    expect(setErrors).toHaveBeenCalledWith(['Please enter a parameter']);
  });
});
