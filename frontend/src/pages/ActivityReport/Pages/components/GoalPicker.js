import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uniqBy } from 'lodash';
import PropTypes from 'prop-types';
import { Label } from '@trussworks/react-uswds';
import { useFormContext, useWatch, useController } from 'react-hook-form/dist/index.ie11';
import Select from 'react-select';
import { getTopics } from '../../../../fetchers/topics';
import Req from '../../../../components/Req';
import Option from './GoalOption';
import SingleValue from './GoalValue';
import selectOptionsReset from '../../../../components/selectOptionsReset';
import { validateGoals } from './goalValidator';
import './GoalPicker.css';
import GoalForm from './GoalForm';

export const newGoal = () => ({
  value: uuidv4(),
  number: false,
  label: 'Create new goal',
  objectives: [],
  name: '',
  goalNumber: '',
  id: 'new',
  isNew: true,
  endDate: '',
});

const components = {
  Option,
  SingleValue,
};

const GoalPicker = ({
  availableGoals,
}) => {
  const {
    control, setError,
  } = useFormContext();
  const [topicOptions, setTopicOptions] = useState([]);

  const selectedGoals = useWatch({ name: 'goals' });
  const selectedIds = selectedGoals ? selectedGoals.map((g) => g.id) : [];
  const allAvailableGoals = availableGoals.filter((goal) => !selectedIds.includes(goal.id));

  const {
    field: {
      onChange,
      value: goalForEditing,
    },
  } = useController({
    name: 'goalForEditing',
    rules: {
      validate: {
        validateGoal: (g) => validateGoals([g], setError) === true,
      },
    },
    defaultValue: newGoal(),
  });

  // for fetching topic options from API
  useEffect(() => {
    async function fetchTopics() {
      const topicsFromApi = await getTopics();

      const topicsAsOptions = topicsFromApi.map((topic) => ({
        label: topic.name,
        value: topic.id,
      }));
      setTopicOptions(topicsAsOptions);
    }

    fetchTopics();
  }, []);

  const uniqueAvailableGoals = uniqBy(allAvailableGoals, 'id');

  // We need options with the number and also we need to add the
  // "create new goal to the front of all the options"
  const options = [
    newGoal(),
    ...uniqueAvailableGoals.map(({
      goalNumber,
      ...goal
    }) => (
      {
        value: goal.id,
        number: goalNumber,
        label: goal.name,
        objectives: [],
        isNew: false,
        ...goal,
      }
    )),
  ];

  return (
    <div className="margin-top-4">
      <Label>
        Select recipient&apos;s goal
        <Req />
        <Select
          name="goalForEditing"
          control={control}
          components={components}
          onChange={onChange}
          rules={{
            validate: validateGoals,
          }}
          className="usa-select"
          options={options}
          styles={{
            ...selectOptionsReset,
            option: (provided) => ({
              ...provided,
              marginBottom: '0.5em',
            }),
          }}
          placeholder="- Select -"
          value={goalForEditing}
        />
      </Label>
      {goalForEditing ? (
        <div>
          <GoalForm topicOptions={topicOptions} goal={goalForEditing} />
        </div>
      ) : null }
    </div>
  );
};

GoalPicker.propTypes = {
  availableGoals: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    }),
  ).isRequired,
};

export default GoalPicker;
