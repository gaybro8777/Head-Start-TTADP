import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import {
  FormGroup, Label,
} from '@trussworks/react-uswds';
import {
  SELECT_GRANTS_ERROR,
} from './constants';
import selectOptionsReset from '../selectOptionsReset';
import Req from '../Req';

export default function GrantSelect({
  error,
  selectedGrants,
  isOnReport,
  setSelectedGrants,
  possibleGrants,
  validateGrantNumbers,
  inputName,
  label,
  isLoading,
  goalStatus,
  userCanEdit,
}) {
  return (
    <FormGroup error={error.props.children}>
      <Label htmlFor={inputName} className={isOnReport || goalStatus === 'Closed' ? 'text-bold' : ''}>
        {label}
        {' '}
        {!isOnReport ? <Req /> : null }
      </Label>
      {possibleGrants.length === 1 || isOnReport || !userCanEdit ? (
        <p className="margin-top-0 usa-prose">{selectedGrants.map((grant) => grant.label).join(', ')}</p>
      ) : (
        <>
          {error}
          <Select
            placeholder=""
            inputId={inputName}
            onChange={setSelectedGrants}
            options={possibleGrants}
            styles={selectOptionsReset}
            components={{
              DropdownIndicator: null,
            }}
            className="usa-select"
            closeMenuOnSelect={false}
            value={selectedGrants}
            isMulti
            onBlur={() => validateGrantNumbers(SELECT_GRANTS_ERROR)}
            isDisabled={isLoading}
          />
        </>
      )}
    </FormGroup>
  );
}

GrantSelect.propTypes = {
  error: PropTypes.node.isRequired,
  selectedGrants: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
  })).isRequired,
  isOnReport: PropTypes.bool.isRequired,
  setSelectedGrants: PropTypes.func.isRequired,
  possibleGrants: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
  })).isRequired,
  validateGrantNumbers: PropTypes.func.isRequired,
  inputName: PropTypes.string,
  label: PropTypes.string,
  isLoading: PropTypes.bool,
  goalStatus: PropTypes.string.isRequired,
  userCanEdit: PropTypes.bool.isRequired,
};

GrantSelect.defaultProps = {
  inputName: 'recipientGrantNumbers',
  label: 'Recipient grant numbers',
  isLoading: false,
};
