import React, { useState, useEffect } from 'react';
import { uniqBy } from 'lodash';
import PropTypes from 'prop-types';
import { Label } from '@trussworks/react-uswds';
import { useFormContext, useWatch } from 'react-hook-form/dist/index.ie11';
import Select from 'react-select';
import { getTopics } from '../../../../fetchers/topics';
import Req from '../../../../components/Req';
import Option from './GoalOption';
import SingleValue from './GoalValue';
import selectOptionsReset from '../../../../components/selectOptionsReset';
import { validateGoals } from './goalValidator';
import './GoalPicker.css';
import GoalForm from './GoalForm';

const components = {
  Option,
  SingleValue,
};

const GoalPicker = ({
  availableGoals,
}) => {
  const {
    control, setValue,
  } = useFormContext();
  const [topicOptions, setTopicOptions] = useState([]);
  const goalForEditing = useWatch({ name: 'goalForEditing' });

  // availableGoals: goals passed into GoalPicker. getGoals returns GrantGoals
  // inMemoryGoals: unsaved goals, deselected goals
  // selectedGoals: goals selected by user in MultiSelect
  const allAvailableGoals = [...availableGoals];

  const onChange = (goal) => {
    setValue('goalForEditing', goal);
  };

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
    {
      value: 'new', number: false, label: 'Create new goal', objectives: [],
    },
    ...uniqueAvailableGoals.map(({
      goalNumber, ...goal
    }) => (
      {
        value: goal.id, number: goalNumber, label: goal.name, objectives: [], ...goal,
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
