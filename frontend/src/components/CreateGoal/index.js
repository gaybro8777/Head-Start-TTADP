/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';
import { Alert, Button } from '@trussworks/react-uswds';
import ReactRouterPropTypes from 'react-router-prop-types';
import PropTypes from 'prop-types';
import Container from '../Container';
import { createOrUpdateGoals, deleteGoal } from '../../fetchers/goals';
import Form, { FORM_FIELD_INDEXES } from './Form';
import { DECIMAL_BASE } from '../../Constants';
import ReadOnly from './ReadOnly';

export default function CreateGoal({ recipient, regionId, match }) {
  const { goalId } = match.params;
  const history = useHistory();

  const possibleGrants = recipient.grants.map((g) => ({
    value: g.id,
    label: g.numberWithProgramTypes,
  }));

  const goalDefaults = useMemo(() => ({
    goalName: '',
    endDate: null,
    status: 'Draft',
    grants: possibleGrants.length === 1 ? [possibleGrants[0]] : [],
    id: goalId,
  }), [goalId, possibleGrants]);

  const [selectedGrants, setSelectedGrants] = useState(goalDefaults.grants);

  const [showForm, setShowForm] = useState(true);

  // this will store our created goals
  const [createdGoals, setCreatedGoals] = useState([]);

  const [goalName, setGoalName] = useState(goalDefaults.goalName);
  const [endDate, setEndDate] = useState(goalDefaults.endDate);
  const [status, setStatus] = useState(goalDefaults.status);
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  const [errors, setErrors] = useState([<></>, <></>, <></>]);

  const validateGoalName = () => {
    let error = <></>;

    if (!goalName) {
      error = <span className="usa-error-message">Please enter a goal name</span>;
    }

    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.NAME, 1, error);
    setErrors(newErrors);

    return !error.props.children;
  };

  const validateEndDate = () => {
    let error = <></>;

    if (endDate && !moment(endDate, 'MM/DD/YYYY').isValid()) {
      error = <span className="usa-error-message">Please valid date in the format mm/dd/yyyy</span>;
    }

    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.END_DATE, 1, error);
    setErrors(newErrors);
    return !error.props.children;
  };

  const validateGrantNumbers = () => {
    let error = <></>;

    if (!selectedGrants.length) {
      error = <span className="usa-error-message">Please select at least one recipient grant</span>;
    }

    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.GRANTS, 1, error);
    setErrors(newErrors);

    return !error.props.children;
  };

  const isValidNotStarted = () => validateGrantNumbers() && validateGoalName() && validateEndDate();
  const isValidDraft = () => validateEndDate() && (validateGrantNumbers() || validateGoalName());

  /**
   * button click handlers
   */

  // on form submit
  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const newCreatedGoals = createdGoals.map((g) => ({
        ...g,
        status: 'Not Started',
      }));

      const goals = await createOrUpdateGoals(newCreatedGoals);

      // on success, redirect back to RTR Goals & Objectives page
      // once integrated into the AR, this will probably have to be turned into a prop function
      // that gets called on success
      history.push(`/recipient-tta-records/${recipient.id}/region/${parseInt(regionId, DECIMAL_BASE)}/goals-objectives`, {
        ids: goals.map((g) => g.id),
      });
    } catch (err) {
      setAlert({
        message: 'There was an error saving your goal',
        type: 'error',
      });
    }
  };

  const onSaveDraft = async () => {
    if (!isValidDraft()) {
      return;
    }

    try {
      const goals = [{
        grants: selectedGrants,
        name: goalName,
        status,
        endDate: endDate && endDate !== 'Invalid date' ? endDate : null,
        regionId: parseInt(regionId, DECIMAL_BASE),
        recipientId: recipient.id,
      }, ...createdGoals];

      await createOrUpdateGoals(goals);
      setAlert({
        message: `Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`,
        type: 'success',
      });
    } catch (error) {
      setAlert({
        message: 'There was an error saving your goal',
        type: 'error',
      });
    }
  };

  const clearForm = () => {
    // clear our form fields
    setGoalName(goalDefaults.goalName);
    setEndDate(goalDefaults.endDate);
    setStatus(goalDefaults.status);
    setSelectedGrants(goalDefaults.grants);
    setShowForm(false);
  };

  const onSaveAndContinue = async () => {
    if (!isValidNotStarted()) {
      return;
    }

    try {
      const goals = [{
        grants: selectedGrants,
        name: goalName,
        status,
        endDate: endDate && endDate !== 'Invalid date' ? endDate : null,
        regionId: parseInt(regionId, DECIMAL_BASE),
        recipientId: recipient.id,
      }, ...createdGoals];

      const newCreatedGoals = await createOrUpdateGoals(goals);

      setCreatedGoals(newCreatedGoals);

      clearForm();

      setAlert({
        message: `Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`,
        type: 'success',
      });
    } catch (error) {
      setAlert({
        message: 'There was an error saving your goal',
        type: 'error',
      });
    }
  };

  const onEdit = (goal) => {
    console.log(goal);
  };

  /**
   * takes a goal id and attempts to delete it via
   * HTTP
   * @param {Number} g
   */
  const onDelete = async (g) => {
    try {
      await deleteGoal(g, regionId);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Link
        className="ttahub-recipient-record--tabs_back-to-search margin-left-2 margin-top-4 margin-bottom-3 display-inline-block"
        to={`/recipient-tta-records/${recipient.id}/region/${regionId}/goals-objectives/`}
      >
        <FontAwesomeIcon className="margin-right-1" color="#0166ab" icon={faArrowLeft} />
        <span>Back to Goals & Objectives</span>
      </Link>
      <h1 className="landing margin-top-0 margin-bottom-1 margin-left-2">
        TTA Goals for
        {' '}
        {recipient.name}
        {' '}
        - Region
        {regionId}
      </h1>
      <Container className="margin-y-2 margin-left-2 width-tablet padding-top-1" skipTopPadding>
        { createdGoals.length ? (
          <>
            <ReadOnly
              createdGoals={createdGoals}
              onDelete={onDelete}
              onEdit={onEdit}
            />
            <div className="margin-bottom-4">
              {!showForm
                ? (
                  <Button unstyled onClick={() => setShowForm(true)}>
                    <FontAwesomeIcon className="margin-right-1" color="#005ea2" icon={faPlusCircle} />
                    Add another goal
                  </Button>
                ) : null }
            </div>
          </>
        ) : null }

        <form onSubmit={onSubmit}>
          { showForm && (
          <Form
            onSaveDraft={onSaveDraft}
            possibleGrants={possibleGrants}
            selectedGrants={selectedGrants}
            setSelectedGrants={setSelectedGrants}
            goalName={goalName}
            setGoalName={setGoalName}
            recipient={recipient}
            regionId={regionId}
            endDate={endDate}
            setEndDate={setEndDate}
            errors={errors}
            validateGoalName={validateGoalName}
            validateEndDate={validateEndDate}
            validateGrantNumbers={validateGrantNumbers}
          />
          )}

          <div className="margin-top-4">
            { showForm && !createdGoals.length ? (
              <Link
                to={`/recipient-tta-records/${recipient.id}/region/${regionId}/goals-objectives/`}
                className=" usa-button usa-button--outline"
              >
                Cancel
              </Link>
            ) : null }
            { showForm && createdGoals.length ? (
              <Button type="button" outline onClick={clearForm}>Cancel</Button>
            ) : null }
            <Button type="button" outline onClick={onSaveDraft}>Save draft</Button>
            { showForm ? <Button type="button" onClick={onSaveAndContinue}>Save and continue</Button> : null }
            { !showForm ? <Button type="submit">Submit goal</Button> : null }
            { alert.message ? <Alert role="alert" className="margin-y-2" type={alert.type}>{alert.message}</Alert> : null }
          </div>
        </form>
      </Container>
    </>
  );
}

CreateGoal.propTypes = {
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
  regionId: PropTypes.string.isRequired,
  match: ReactRouterPropTypes.match.isRequired,
};
