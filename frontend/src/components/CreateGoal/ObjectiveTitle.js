import React from 'react';
import PropTypes from 'prop-types';
import {
  FormGroup, Label, Textarea,
} from '@trussworks/react-uswds';

export default function ObjectiveTitle({
  error,
  isOnApprovedReport,
  title,
  onChangeTitle,
  validateObjectiveTitle,
  status,
}) {
  const readOnly = isOnApprovedReport || status === 'Complete';

  return (
    <FormGroup className="margin-top-1" error={error.props.children}>
      <Label htmlFor="objectiveTitle" className={readOnly ? 'text-bold' : ''}>
        TTA objective
        {' '}
        { !readOnly ? <span className="smart-hub--form-required font-family-sans font-ui-xs">*</span> : null }
      </Label>
      { readOnly && title ? (
        <p className="margin-top-0 usa-prose">{title}</p>
      ) : (
        <>
          {error}
          <Textarea id="objectiveTitle" name="objectiveTitle" required value={title} onChange={onChangeTitle} onBlur={validateObjectiveTitle} />
        </>
      )}
    </FormGroup>
  );
}

ObjectiveTitle.propTypes = {
  error: PropTypes.node.isRequired,
  isOnApprovedReport: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  validateObjectiveTitle: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
};