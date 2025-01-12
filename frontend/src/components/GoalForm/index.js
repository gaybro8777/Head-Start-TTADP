import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useContext,
} from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';
import { Alert, Button } from '@trussworks/react-uswds';
import PropTypes from 'prop-types';
import Container from '../Container';
import { createOrUpdateGoals, deleteGoal } from '../../fetchers/goals';
import { goalsByIdAndRecipient } from '../../fetchers/recipient';
import { uploadObjectivesFile } from '../../fetchers/File';
import { getTopics } from '../../fetchers/topics';
import Form from './Form';
import {
  FORM_FIELD_INDEXES,
  FORM_FIELD_DEFAULT_ERRORS,
  validateListOfResources,
  OBJECTIVE_ERROR_MESSAGES,
  GOAL_NAME_ERROR,
  GOAL_DATE_ERROR,
  SELECT_GRANTS_ERROR,
  OBJECTIVE_DEFAULT_ERRORS,
  GOAL_RTTAPA_ERROR,
  objectivesWithValidResourcesOnly,
} from './constants';
import { DECIMAL_BASE, SCOPE_IDS } from '../../Constants';
import ReadOnly from './ReadOnly';
import PlusButton from './PlusButton';
import colors from '../../colors';
import AppLoadingContext from '../../AppLoadingContext';
import useUrlParamState from '../../hooks/useUrlParamState';
import UserContext from '../../UserContext';

const [
  objectiveTextError,
  objectiveTopicsError,
  objectiveResourcesError,,
  objectiveStatusError,
] = OBJECTIVE_ERROR_MESSAGES;

const formatGrantsFromApi = (grants) => grants
  .map((grant) => {
    const programTypes = grant.programs.map(({ programType }) => programType).join(', ');
    return {
      value: grant.id,
      label: `${grant.number} - ${programTypes}`,
      id: grant.id,
    };
  });

export default function GoalForm({
  recipient,
  regionId,
  showRTRnavigation,
  isNew,
}) {
  const history = useHistory();
  const possibleGrants = recipient.grants.filter(((g) => g.status === 'Active')).map((g) => ({
    value: g.id,
    label: g.numberWithProgramTypes,
  }));

  const goalDefaults = useMemo(() => ({
    name: '',
    endDate: null,
    status: 'Draft',
    grants: possibleGrants.length === 1 ? [possibleGrants[0]] : [],
    objectives: [],
    id: 'new',
    onApprovedAR: false,
    isRttapa: '',
  }), [possibleGrants]);

  const [showForm, setShowForm] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // this will store our created goals (vs the goal that's occupying the form at present)
  const [createdGoals, setCreatedGoals] = useState([]);

  // this is for the topic options returned from the API
  const [topicOptions, setTopicOptions] = useState([]);
  const [goalName, setGoalName] = useState(goalDefaults.name);
  const [endDate, setEndDate] = useState(goalDefaults.endDate);
  const [selectedGrants, setSelectedGrants] = useState(goalDefaults.grants);
  const [isRttapa, setIsRttapa] = useState(goalDefaults.isRttapa);
  const [goalOnApprovedAR, setGoalOnApprovedReport] = useState(goalDefaults.onApprovedAR);

  const initialRttapa = useRef(isRttapa);

  // we need to set this key to get the component to re-render (uncontrolled input)
  const [datePickerKey, setDatePickerKey] = useState('DPK-00');

  const [status, setStatus] = useState(goalDefaults.status);
  const [objectives, setObjectives] = useState(goalDefaults.objectives);

  const [alert, setAlert] = useState({ message: '', type: 'success' });
  const [goalNumbers, setGoalNumbers] = useState('');

  const [errors, setErrors] = useState(FORM_FIELD_DEFAULT_ERRORS);

  const { isAppLoading, setIsAppLoading, setAppLoadingText } = useContext(AppLoadingContext);

  const { user } = useContext(UserContext);

  const canView = useMemo(() => user.permissions.filter(
    (permission) => permission.regionId === parseInt(regionId, DECIMAL_BASE),
  ).length > 0, [regionId, user.permissions]);

  const canEdit = useMemo(() => user.permissions.filter(
    (permission) => permission.regionId === parseInt(regionId, DECIMAL_BASE)
      && (
        permission.scopeId === SCOPE_IDS.READ_WRITE_ACTIVITY_REPORTS
        || permission.scopeId === SCOPE_IDS.APPROVE_ACTIVITY_REPORTS
      ),
  ).length > 0, [regionId, user.permissions]);

  const isOnReport = useMemo(() => objectives.some(
    (objective) => objective.activityReports && objective.activityReports.length > 0,
  ), [objectives]);

  // we can access the params as the third arg returned by useUrlParamState
  // (if we need it)
  const [ids, setIds] = useUrlParamState('id[]');

  // for fetching goal data from api if it exists
  useEffect(() => {
    async function fetchGoal() {
      setFetchAttempted(true); // as to only fetch once
      try {
        const [goal] = await goalsByIdAndRecipient(
          ids, recipient.id.toString(),
        );

        // for these, the API sends us back things in a format we expect
        setGoalName(goal.name);
        setStatus(goal.status);
        setEndDate(goal.endDate);
        setDatePickerKey(goal.endDate ? `DPK-${goal.endDate}` : '00');
        setIsRttapa(goal.isRttapa);
        initialRttapa.current = goal.isRttapa;
        setSelectedGrants(formatGrantsFromApi([goal.grant]));
        setGoalNumbers(goal.goalNumbers);
        setGoalOnApprovedReport(goal.onApprovedAR);

        // this is a lot of work to avoid two loops through the goal.objectives
        // but I'm sure you'll agree its totally worth it
        const [
          newObjectives, // return objectives w/ resources and topics formatted as expected
          objectiveErrors, // and we need a matching error for each objective
        ] = goal.objectives.reduce((previous, objective) => {
          const [newObjs, objErrors] = previous;
          let newObjective = objective;

          if (!objective.resources.length) {
            newObjective = {
              ...objective,
              resources: [
                // this is the expected format of a blank resource
                // all objectives start off with one
                {
                  key: uuidv4(),
                  value: '',
                },
              ],
            };
          }

          newObjs.push(newObjective);
          // this is the format of an objective error
          // three JSX nodes representing each of three possible errors
          objErrors.push(OBJECTIVE_DEFAULT_ERRORS);

          return [newObjs, objErrors];
        }, [[], []]);

        const newErrors = [...errors];
        newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES, 1, objectiveErrors);
        setErrors(newErrors);

        setObjectives(newObjectives);
      } catch (err) {
        setFetchError('There was an error loading your goal');
      } finally {
        setIsAppLoading(false);
      }
    }

    if (!fetchAttempted && !isNew && !isAppLoading) {
      setAppLoadingText('Loading');
      setIsAppLoading(true);
      fetchGoal();
    }
  }, [errors,
    fetchAttempted,
    recipient.id,
    isNew,
    isAppLoading,
    ids,
    setAppLoadingText,
    setIsAppLoading]);

  // for fetching topic options from API
  useEffect(() => {
    async function fetchTopics() {
      try {
        const topics = await getTopics();
        setTopicOptions(topics);
      } catch (err) {
        setFetchError('There was an error loading topics');
      }
    }
    fetchTopics();
  }, []);

  const setObjectiveError = (objectiveIndex, errorText) => {
    const newErrors = [...errors];
    const objectiveErrors = [...newErrors[FORM_FIELD_INDEXES.OBJECTIVES]];
    objectiveErrors.splice(objectiveIndex, 1, errorText);
    newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES, 1, objectiveErrors);
    setErrors(newErrors);
  };

  // form field validation functions

  /** @returns bool */
  const validateGoalNameAndRecipients = (messages = [
    GOAL_NAME_ERROR,
    SELECT_GRANTS_ERROR,
  ]) => {
    let validName = true;
    let validRecipients = true;

    if (!goalName) {
      validName = false;
    }

    if (!selectedGrants.length) {
      validRecipients = false;
    }

    const newErrors = [...errors];
    if (!validName) {
      newErrors.splice(FORM_FIELD_INDEXES.NAME, 1, <span className="usa-error-message">{messages[0]}</span>);
    }

    if (!validRecipients) {
      newErrors.splice(FORM_FIELD_INDEXES.GRANTS, 1, <span className="usa-error-message">{messages[1]}</span>);
    }

    setErrors(newErrors);

    return validName && validRecipients;
  };

  /**
   *
   * @returns bool
   */
  const validateGoalName = (message = GOAL_NAME_ERROR) => {
    let error = <></>;

    if (!goalName || !goalName.trim()) {
      error = <span className="usa-error-message">{message}</span>;
    }

    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.NAME, 1, error);
    setErrors(newErrors);

    return !error.props.children;
  };

  /**
   *
   * @returns bool
   */
  const validateEndDate = () => {
    let error = <></>;

    if (endDate && !moment(endDate, 'MM/DD/YYYY').isValid()) {
      error = <span className="usa-error-message">{GOAL_DATE_ERROR}</span>;
    }

    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.END_DATE, 1, error);
    setErrors(newErrors);
    return !error.props.children;
  };

  const validateGrantNumbers = (message = SELECT_GRANTS_ERROR) => {
    let error = <></>;
    if (!selectedGrants.length) {
      error = <span className="usa-error-message">{message}</span>;
    }
    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.GRANTS, 1, error);
    setErrors(newErrors);

    return !error.props.children;
  };

  const validateIsRttapa = () => {
    let error = <></>;
    if (isRttapa !== 'Yes' && isRttapa !== 'No') {
      error = <span className="usa-error-message">{GOAL_RTTAPA_ERROR}</span>;
    }
    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.IS_RTTAPA, 1, error);
    setErrors(newErrors);
    return !error.props.children;
  };

  /**
   *
   * @returns bool
   */
  const validateObjectives = () => {
    if (!objectives.length) {
      return true;
    }

    const newErrors = [...errors];
    let isValid = true;

    const newObjectiveErrors = objectives.map((objective) => {
      if (objective.status === 'Complete' || (objective.activityReports && objective.activityReports.length)) {
        return [
          <></>,
          <></>,
          <></>,
          <></>,
          <></>,
        ];
      }

      if (!objective.title) {
        isValid = false;
        return [
          <span className="usa-error-message">{objectiveTextError}</span>,
          <></>,
          <></>,
          <></>,
          <></>,
        ];
      }

      if (!objective.topics.length) {
        isValid = false;
        return [
          <></>,
          <span className="usa-error-message">{objectiveTopicsError}</span>,
          <></>,
          <></>,
          <></>,
        ];
      }

      if (!validateListOfResources(objective.resources)) {
        isValid = false;
        return [
          <></>,
          <></>,
          <span className="usa-error-message">{objectiveResourcesError}</span>,
          <></>,
          <></>,
        ];
      }

      if (!objective.status) {
        isValid = false;
        return [
          <></>,
          <></>,
          <></>,
          <span className="usa-error-message">{objectiveStatusError}</span>,
          <></>,
        ];
      }

      return [
        <></>,
        <></>,
        <></>,
        <></>,
        <></>,
      ];
    });

    newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES, 1, newObjectiveErrors);
    setErrors(newErrors);

    return isValid;
  };

  const validateResourcesOnly = () => {
    if (!objectives.length) {
      return true;
    }

    const newErrors = [...errors];
    let isValid = true;

    const newObjectiveErrors = objectives.map((objective) => {
      if (!validateListOfResources(objective.resources)) {
        isValid = false;
        return [
          <></>,
          <></>,
          <span className="usa-error-message">{objectiveResourcesError}</span>,
          <></>,
          <></>,
        ];
      }
      return [
        <></>,
        <></>,
        <></>,
        <></>,
        <></>,
      ];
    });

    newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES, 1, newObjectiveErrors);
    setErrors(newErrors);

    return isValid;
  };

  const clearEmptyObjectiveError = () => {
    const error = <></>;
    const newErrors = [...errors];
    newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES_EMPTY, 1, error);
    setErrors(newErrors);
  };

  // quick shorthands to check to see if our fields are good to save to the different states
  // (different validations for not started and draft)
  const isValidNotStarted = () => (
    validateGrantNumbers()
    && validateGoalName()
    && validateEndDate()
    && validateObjectives()
    && validateIsRttapa()
  );
  const isValidDraft = () => (
    validateGrantNumbers()
    && validateGoalName()
    && validateResourcesOnly()
  );

  const updateObjectives = (updatedObjectives) => {
    // when we set a new set of objectives
    // an error object for each objective.
    const newErrors = [...errors];
    const objectiveErrors = updatedObjectives.map(() => OBJECTIVE_DEFAULT_ERRORS);

    newErrors.splice(FORM_FIELD_INDEXES.OBJECTIVES, 1, objectiveErrors);
    setErrors(newErrors);
    setObjectives(updatedObjectives);
  };

  const redirectToGoalsPage = (goals) => {
    history.push(`/recipient-tta-records/${recipient.id}/region/${parseInt(regionId, DECIMAL_BASE)}/goals-objectives`, {
      ids: goals.map((g) => g.id),
    });
  };

  /**
   * button click handlers
   */

  // on form submit
  const onSubmit = async (e) => {
    e.preventDefault();
    setAppLoadingText('Submitting');
    setIsAppLoading(true);
    try {
      // if the goal is a draft, submission should move it to "not started"
      const gs = createdGoals.reduce((acc, goal) => {
        const statusToSave = goal.status && goal.status === 'Draft' ? 'Not Started' : goal.status;
        const newGoals = goal.grants.map((grant) => ({
          grantId: grant.id,
          name: goal.name,
          status: statusToSave,
          endDate: goal.endDate && goal.endDate !== 'Invalid date' ? goal.endDate : null,
          isRttapa: goal.isRttapa,
          regionId: parseInt(regionId, DECIMAL_BASE),
          recipientId: recipient.id,
          objectives: goal.objectives,
          ids,
        }));

        return [...acc, ...newGoals];
      }, []);

      const goals = await createOrUpdateGoals(gs);

      // on success, redirect back to RTR Goals & Objectives page
      // once integrated into the AR, this will probably have to be turned into a prop function
      // that gets called on success
      redirectToGoalsPage(goals);
    } catch (err) {
      setAlert({
        message: 'There was an error saving your goal',
        type: 'error',
      });
    } finally {
      setIsAppLoading(false);
    }
  };

  const onUploadFiles = async (files, objective, setFileUploadErrorMessage, index) => {
    // The first thing we need to know is... does this objective need to be created?
    setAppLoadingText('Uploading');
    setIsAppLoading(true);

    // there is some weirdness where an objective may or may not have the "ids" property
    let objectiveIds = objective.ids ? objective.ids : [];
    if (!objectiveIds.length && objective.id) {
      objectiveIds = [objective.id];
    }

    if (objective.isNew) {
      // if so, we save the objective to the database first
      try {
        // but to do that, we first need to save the goals
        const newGoals = selectedGrants.map((g) => ({
          grantId: g.value,
          name: goalName,
          status,
          isRttapa,
          endDate: endDate && endDate !== 'Invalid date' ? endDate : null,
          regionId: parseInt(regionId, DECIMAL_BASE),
          recipientId: recipient.id,
          objectives,
        }));

        // so we save them, as before creating one for each grant
        const savedGoals = await createOrUpdateGoals(newGoals);

        // and then we pluck out the objectives from the newly saved goals
        // (there will be only "one")
        objectiveIds = savedGoals.reduce((p, c) => {
          const newObjectives = c.objectives.reduce((prev, o) => {
            if (objective.title === o.title) {
              return [
                ...prev,
                o.id,
                ...o.ids,
              ];
            }

            return prev;
          }, []);

          return Array.from(new Set([...p, ...newObjectives]));
        }, []);
      } catch (err) {
        setFileUploadErrorMessage('File could not be uploaded');
      }
    }

    try {
      // an objective that's been saved should have a set of IDS
      // in the case that it has been rolled up to match a goal for multiple grants
      const data = new FormData();
      data.append('objectiveIds', JSON.stringify(objectiveIds));
      files.forEach((file) => {
        data.append('file', file);
      });

      const response = await uploadObjectivesFile(data);
      setFileUploadErrorMessage(null);

      return {
        ...response,
        objectives,
        setObjectives,
        objectiveIds,
        index,
      };
    } catch (error) {
      setFileUploadErrorMessage('File(s) could not be uploaded');
    } finally {
      setIsAppLoading(false);
    }

    return null;
  };

  const onSaveDraft = async () => {
    if (!isValidDraft()) {
      // attempt to focus on the first invalid field
      const invalid = document.querySelector('.usa-form :invalid:not(fieldset), .usa-form-group--error textarea, .usa-form-group--error input, .usa-error-message + .ttahub-resource-repeater input');
      if (invalid) {
        invalid.focus();
      }
      return;
    }
    setAppLoadingText('Saving');
    setIsAppLoading(true);

    try {
      let newGoals = [];

      if (showForm) {
        newGoals = selectedGrants.map((g) => ({
          grantId: g.value,
          name: goalName,
          status,
          isRttapa,
          endDate: endDate && endDate !== 'Invalid date' ? endDate : null,
          regionId: parseInt(regionId, DECIMAL_BASE),
          recipientId: recipient.id,
          objectives: objectivesWithValidResourcesOnly(objectives),
          ids,
        }));
      }

      const mappedCreatedGoals = createdGoals.map((goal) => goal.grantIds.map((grantId) => ({
        grantId,
        ...goal,
      }))).flat();

      const goals = [
        ...mappedCreatedGoals,
        ...newGoals,
      ];

      const updatedGoals = await createOrUpdateGoals(goals);

      // this find will only ever 1 goal
      // representing the goal being edited
      // we search the new goals and get the one that wasn't in the existing created goals
      // (only one goal can be edited at a time, and even multi grant goals
      // are deduplicated on the backend)
      const existingIds = createdGoals.map((g) => g.id);
      const goalForEditing = updatedGoals.find((goal) => {
        const { id } = goal;
        return !existingIds.includes(id);
      });

      const updatedObjectives = goalForEditing
        && goalForEditing.objectives ? goalForEditing.objectives : [];

      updateObjectives(updatedObjectives);

      setAlert({
        message: `Your goal was last saved at ${moment().format('MM/DD/YYYY [at] h:mm a')}`,
        type: 'success',
      });

      // if we are not creating a new goal, we want to update the goal ids
      // for the case of adding a grant to an existing goal. If we are creating a new goal,
      // we don't keep track of the ids, so we don't need to update them
      if (!isNew) {
        const newIds = updatedGoals.flatMap((g) => g.goalIds);
        setIds(newIds);
      }
    } catch (error) {
      setAlert({
        message: 'There was an error saving your goal',
        type: 'error',
      });
    } finally {
      setIsAppLoading(false);
    }
  };

  const clearForm = () => {
    // clear our form fields
    setGoalName(goalDefaults.name);
    setEndDate(goalDefaults.endDate);
    setStatus(goalDefaults.status);
    setIsRttapa(goalDefaults.isRttapa);
    initialRttapa.current = goalDefaults.isRttapa;
    setSelectedGrants(goalDefaults.grants);
    setShowForm(false);
    setObjectives([]);
    setDatePickerKey('DPK-00');
  };

  const onSaveAndContinue = async (redirect = false) => {
    if (!isValidNotStarted()) {
      // attempt to focus on the first invalid field
      const invalid = document.querySelector('.usa-form :invalid:not(fieldset), .usa-form-group--error textarea, .usa-form-group--error input, .usa-error-message + .ttahub-resource-repeater input');
      if (invalid) {
        invalid.focus();
      }
      return;
    }
    setAppLoadingText('Saving');
    setIsAppLoading(true);
    try {
      const newGoals = selectedGrants.map((g) => ({
        grantId: g.value,
        name: goalName,
        status,
        endDate,
        isRttapa,
        regionId: parseInt(regionId, DECIMAL_BASE),
        recipientId: recipient.id,
        objectives,
        ids,
      }));

      const goals = [
        ...createdGoals.reduce((acc, goal) => {
          const g = goal.grants.map((grant) => ({
            grantId: grant.id,
            name: goal.name,
            status,
            endDate: goal.endDate && goal.endDate !== 'Invalid date' ? goal.endDate : null,
            regionId: parseInt(regionId, DECIMAL_BASE),
            recipientId: recipient.id,
            objectives: objectivesWithValidResourcesOnly(goal.objectives),
            isRttapa: goal.isRttapa,
          }));
          return [...acc, ...g];
        }, []),
        ...newGoals,
      ];

      const newCreatedGoals = await createOrUpdateGoals(goals);

      setCreatedGoals(newCreatedGoals.map((goal) => ({
        ...goal,
        grants: formatGrantsFromApi(goal.grants),
        objectives: goal.objectives.map((objective) => ({
          ...objective,
        })),
      })));

      if (redirect) {
        redirectToGoalsPage(newCreatedGoals);
      }

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
    } finally {
      setIsAppLoading(false);
    }
  };

  const onEdit = (goal, index) => {
    // move from "created goals" to the form

    // first remove from the createdGoals array
    const newCreatedGoals = createdGoals.map((g) => ({ ...g }));
    newCreatedGoals.splice(index, 1);
    setCreatedGoals(newCreatedGoals);

    // then repopulate the form
    setGoalName(goal.name);
    setEndDate(goal.endDate);
    setStatus(goal.status);
    setGoalNumbers(goal.goalNumbers);
    setSelectedGrants(goal.grants);
    setIsRttapa(goal.isRttapa);
    initialRttapa.current = goal.isRttapa;

    // we need to update the date key so it re-renders all the
    // date pickers, as they are uncontrolled inputs
    // PS - endDate can be null
    setDatePickerKey(goal.endDate ? `DPK-${goal.endDate}` : '00');
    setObjectives(goal.objectives);

    setShowForm(true);
  };

  /**
   * takes a goal id and attempts to delete it via
   * HTTP
   * @param {Number} g
   */
  const onRemove = async (g) => {
    setAppLoadingText('Removing goal');
    setIsAppLoading(true);
    try {
      const success = await deleteGoal(g.goalIds, regionId);

      if (success) {
        const newGoals = createdGoals.filter((goal) => goal.id !== g.id);
        setCreatedGoals(newGoals);
        if (!newGoals.length) {
          setShowForm(true);
        }

        setAlert({
          message: '',
          type: 'success',
        });
      }
    } catch (err) {
      setAlert({
        message: 'There was an error deleting your goal',
        type: 'error',
      });
    } finally {
      setIsAppLoading(false);
    }
  };

  if (!canView) {
    return (
      <Alert role="alert" className="margin-y-2" type="error">
        You don&apos;t have permission to view this page
      </Alert>
    );
  }

  return (
    <>
      { showRTRnavigation ? (
        <Link
          className="ttahub-recipient-record--tabs_back-to-search margin-left-2 margin-top-4 margin-bottom-3 display-inline-block"
          to={`/recipient-tta-records/${recipient.id}/region/${regionId}/goals-objectives/`}
        >
          <FontAwesomeIcon className="margin-right-1" color={colors.ttahubMediumBlue} icon={faArrowLeft} />
          <span>Back to Goals & Objectives</span>
        </Link>
      ) : null }
      <h1 className="page-heading margin-top-0 margin-bottom-0 margin-left-2">
        TTA Goals for
        {' '}
        {recipient.name}
        {' '}
        - Region
        {' '}
        {regionId}
      </h1>

      <Container className="margin-y-3 margin-left-2 width-tablet" paddingX={4} paddingY={5}>
        { createdGoals.length ? (
          <>
            <ReadOnly
              createdGoals={createdGoals}
              onRemove={onRemove}
              onEdit={onEdit}
            />
            <div className="margin-bottom-4">
              {!showForm && isNew
                ? (
                  <PlusButton onClick={() => setShowForm(true)} text="Add another goal" />
                ) : null }
            </div>
          </>
        ) : null }

        <form onSubmit={onSubmit}>
          { showForm && (
            <Form
              fetchError={fetchError}
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
              datePickerKey={datePickerKey}
              isRttapa={isRttapa}
              setIsRttapa={setIsRttapa}
              initialRttapa={initialRttapa.current}
              validateIsRttapa={validateIsRttapa}
              errors={errors}
              validateGoalName={validateGoalName}
              validateEndDate={validateEndDate}
              validateGrantNumbers={validateGrantNumbers}
              validateGoalNameAndRecipients={validateGoalNameAndRecipients}
              objectives={objectives}
              setObjectives={setObjectives}
              setObjectiveError={setObjectiveError}
              clearEmptyObjectiveError={clearEmptyObjectiveError}
              topicOptions={topicOptions}
              isOnReport={isOnReport}
              isOnApprovedReport={goalOnApprovedAR}
              status={status || 'Needs status'}
              goalNumbers={goalNumbers}
              onUploadFiles={onUploadFiles}
              userCanEdit={canEdit}
            />
          )}

          { canEdit && (isNew || status === 'Draft') && status !== 'Closed' && (
          <div className="margin-top-4">
            { !showForm ? <Button type="submit">Submit goal</Button> : null }
            { showForm ? <Button type="button" onClick={() => onSaveAndContinue(false)}>Save and continue</Button> : null }
            { showForm ? <Button type="button" outline onClick={onSaveDraft}>Save draft</Button> : null }
            { showForm && !createdGoals.length ? (
              <Link
                to={`/recipient-tta-records/${recipient.id}/region/${regionId}/goals-objectives/`}
                className=" usa-button usa-button--outline"
              >
                Cancel
              </Link>
            ) : null }
            { showForm && createdGoals.length ? (
              <Button type="button" outline onClick={clearForm} data-testid="create-goal-form-cancel">Cancel</Button>
            ) : null }
          </div>
          )}

          { canEdit && (!isNew && status !== 'Draft') && status !== 'Closed' && (
            <div className="margin-top-4">
              <Button
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  await onSaveAndContinue(true);
                }}
              >
                Save
              </Button>
              <Link
                className="usa-button usa-button--outline"
                to={`/recipient-tta-records/${recipient.id}/region/${regionId}/goals-objectives/`}
              >
                Cancel
              </Link>
            </div>
          ) }

          { alert.message ? <Alert role="alert" className="margin-y-2" type={alert.type}>{alert.message}</Alert> : null }
        </form>
      </Container>
    </>
  );
}

GoalForm.propTypes = {
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
  showRTRnavigation: PropTypes.bool,
  isNew: PropTypes.bool,
};

GoalForm.defaultProps = {
  showRTRnavigation: false,
  isNew: false,
};
