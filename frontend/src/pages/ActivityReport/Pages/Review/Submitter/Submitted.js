import React from 'react';
import PropTypes from 'prop-types';

import {
  Alert, Button,
} from '@trussworks/react-uswds';

const NotEditableAlert = () => (
  <Alert type="info" noIcon slim className="margin-bottom-1 no-print">
    <b>Report is not editable</b>
    <br />
    This report is no longer editable while it is waiting for manager approval.
    If you wish to update this report click &quot;Reset to Draft&quot; to
    move the report back to draft mode.
  </Alert>
);

const Submitted = ({
  additionalNotes,
  approvingManager,
  resetToDraft,
}) => (
  <>
    <Alert noIcon className="margin-y-4" type="success">
      <b>Success</b>
      <br />
      This report was successfully submitted for approval
    </Alert>
    <div className="smart-hub--creator-notes">
      <p>
        <span className="text-bold">Creator notes</span>
        <br />
        <br />
        { additionalNotes || 'No creator notes' }
      </p>
    </div>
    <p>
      <span className="text-bold">{approvingManager.name}</span>
      {' '}
      is the approving manager for this report.
      {' '}
    </p>
    <Button type="button" onClick={resetToDraft}>Reset to Draft</Button>
    <NotEditableAlert />
  </>
);

Submitted.propTypes = {
  additionalNotes: PropTypes.string,
  approvingManager: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }).isRequired,
  resetToDraft: PropTypes.func.isRequired,
};

Submitted.defaultProps = {
  additionalNotes: '',
};

export default Submitted;
