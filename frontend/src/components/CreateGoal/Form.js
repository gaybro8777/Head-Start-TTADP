/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import {
  DatePicker, FormGroup, Label, Textarea,
} from '@trussworks/react-uswds';
import ObjectiveForm from './ObjectiveForm';
import './Form.css';
import PlusButton from './PlusButton';
import { OBJECTIVE_DEFAULTS, FORM_FIELD_INDEXES, SELECT_STYLES } from './constants';

export default function Form({
  possibleGrants,
  selectedGrants,
  setSelectedGrants,
  goalName,
  setGoalName,
  endDate,
  setEndDate,
  errors,
  validateGoalName,
  validateEndDate,
  validateGrantNumbers,
  objectives,
  setObjectives,
}) {
  const onUpdateText = (e) => setGoalName(e.target.value);
  const onAddNewObjectiveClick = () => {
    // copy existing state, add a blank
    const obj = [...objectives.map((o) => ({ ...o })), OBJECTIVE_DEFAULTS(objectives.length)];

    // save
    setObjectives(obj);
  };

  return (
    <div className="ttahub-create-goals-form">
      <h2>Recipient TTA goal</h2>
      <h3>Goal summary</h3>
      <FormGroup>
        <Label htmlFor="recipientGrantNumbers">
          Recipient grant numbers
          <span className="smart-hub--form-required font-family-sans font-ui-xs"> (required)</span>
        </Label>
        {possibleGrants.length === 1 ? (
          <span className="margin-bottom-1">{selectedGrants[0].label}</span>
        ) : (
          <>
            <span className="usa-hint">Select all grant numbers that apply to the grant</span>
            {errors[FORM_FIELD_INDEXES.GRANTS]}
            <Select
              placeholder=""
              inputId="recipientGrantNumbers"
              onChange={setSelectedGrants}
              options={possibleGrants}
              styles={SELECT_STYLES}
              components={{
                DropdownIndicator: null,
              }}
              className="usa-select"
              closeMenuOnSelect={false}
              value={selectedGrants}
              isMulti
              onBlur={validateGrantNumbers}
            />
          </>
        )}
      </FormGroup>
      <FormGroup>
        <Label htmlFor="goalText">
          Goal
          <span className="smart-hub--form-required font-family-sans font-ui-xs"> (required)</span>
        </Label>
        <span className="usa-hint">
          What the recipient wants to achieve
        </span>
        {errors[FORM_FIELD_INDEXES.NAME]}
        <Textarea onBlur={validateGoalName} id="goalText" name="goalText" required value={goalName} onChange={onUpdateText} />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="goalEndDate">Goal end date</Label>
        <span className="usa-hint">When does the recipient expect to meet this goal? (mm/dd/yyyy)</span>
        {errors[FORM_FIELD_INDEXES.END_DATE]}
        <DatePicker
          id="goalEndDate"
          name="goalEndDate"
          onChange={setEndDate}
          defaultValue={endDate}
          required
          onBlur={validateEndDate}
        />
      </FormGroup>
      { objectives.map((objective) => <ObjectiveForm key={objective.id} />)}
      <div className="margin-top-2">
        <PlusButton onClick={onAddNewObjectiveClick} text="Add new objective" />
      </div>
    </div>
  );
}

Form.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.node).isRequired,
  validateGoalName: PropTypes.func.isRequired,
  validateEndDate: PropTypes.func.isRequired,
  validateGrantNumbers: PropTypes.func.isRequired,
  possibleGrants: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    }),
  ).isRequired,
  selectedGrants: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    }),
  ).isRequired,
  setSelectedGrants: PropTypes.func.isRequired,
  goalName: PropTypes.string.isRequired,
  setGoalName: PropTypes.func.isRequired,
  recipient: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    grants: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        numberWithProgramTypes: PropTypes.string,
      }),
    ),
  }).isRequired,
  endDate: PropTypes.string,
  setEndDate: PropTypes.func.isRequired,
  setObjectives: PropTypes.func.isRequired,
  objectives: PropTypes.arrayOf(PropTypes.shape({
    objective: PropTypes.string,
    topics: PropTypes.arrayOf(PropTypes.string),
    resources: PropTypes.arrayOf(PropTypes.string),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })).isRequired,
};

Form.defaultProps = {
  endDate: null,
};
