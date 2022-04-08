import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useFormContext } from 'react-hook-form/dist/index.ie11';
import { isEmpty, isUndefined } from 'lodash';
import {
  Fieldset, Radio, Grid, TextInput, Checkbox, Label,
} from '@trussworks/react-uswds';
import ReviewPage from './Review/ReviewPage';
import MultiSelect from '../../../components/MultiSelect';
import {
  otherEntityParticipants,
  recipientParticipants,
} from '../constants';
import FormItem from '../../../components/FormItem';
import { NOT_STARTED } from '../../../components/Navigator/constants';
import ControlledDatePicker from '../../../components/ControlledDatePicker';
import {
  REASONS as reasons,
  TARGET_POPULATIONS as targetPopulations,
} from '../../../Constants';
import HookFormRichEditor from '../../../components/HookFormRichEditor';

import HtmlReviewItem from './Review/HtmlReviewItem';
import Section from './Review/ReviewSection';
import { reportIsEditable } from '../../../utils';

const ActivitySummary = ({
  recipients,
  collaborators,
}) => {
  // we store this to cause the end date to re-render when updated by the start date (and only then)
  const [endDateKey, setEndDateKey] = useState('endDate');

  const {
    register,
    watch,
    setValue,
    control,
    getValues,
  } = useFormContext();
  const activityRecipientType = watch('activityRecipientType');

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const pageState = watch('pageState');
  const isVirtual = watch('deliveryMethod') === 'virtual';
  const { otherEntities: rawOtherEntities, grants: rawGrants } = recipients;

  const grants = rawGrants.map((recipient) => ({
    label: recipient.name,
    options: recipient.grants.map((grant) => ({
      value: grant.activityRecipientId,
      label: grant.name,
    })),
  }));

  const otherEntities = rawOtherEntities.map((entity) => ({
    label: entity.name,
    value: entity.activityRecipientId,
  }));

  const disableRecipients = isEmpty(activityRecipientType);
  const otherEntitySelected = activityRecipientType === 'other-entity';
  const selectedRecipients = otherEntitySelected ? otherEntities : grants;
  const previousActivityRecipientType = useRef(activityRecipientType);
  const recipientLabel = otherEntitySelected ? 'Other entities' : 'Recipient names';
  const participantsLabel = otherEntitySelected ? 'Other entity participants' : 'Recipient participants';
  const participants = otherEntitySelected ? otherEntityParticipants : recipientParticipants;
  const placeholderText = '- Select -';

  useEffect(() => {
    if (previousActivityRecipientType.current !== activityRecipientType
      && previousActivityRecipientType.current !== ''
      && previousActivityRecipientType.current !== null) {
      setValue('activityRecipients', [], { shouldValidate: true });
      setValue('participants', [], { shouldValidate: true });
      // Goals and objectives (page 3) has required fields when the recipient
      // type is recipient, so we need to make sure that page is set as "not started"
      // when recipient type is changed and we need to clear out any previously
      // selected goals and objectives
      setValue('goals', []);
      setValue('objectivesWithoutGoals', []);
      setValue('pageState', { ...pageState, 3: NOT_STARTED });
    }
    previousActivityRecipientType.current = activityRecipientType;
  }, [activityRecipientType, setValue, pageState]);

  const renderCheckbox = (name, value, label, requiredMessage) => (
    <Checkbox
      id={value}
      label={label}
      value={value}
      name={name}
      className="smart-hub--report-checkbox"
      inputRef={register({
        validate: () => (
          getValues(name).length ? true : requiredMessage
        ),
      })}
    />
  );

  const setEndDate = (newEnd) => {
    setValue('endDate', newEnd);

    // this will trigger the re-render of the
    // uncontrolled end date input
    // it's a little clumsy, but it does work
    setEndDateKey(`endDate-${newEnd}`);
  };

  return (
    <>
      <Helmet>
        <title>Activity summary</title>
      </Helmet>
      <p className="usa-prose">
        <span className="smart-hub--form-required font-family-sans font-ui-xs">* </span>
        indicates required field
      </p>
      <Fieldset className="smart-hub--report-legend margin-top-4" legend="Who was the activity for?">
        <div id="activity-for" />
        <div className="margin-top-2">
          <FormItem
            label="Was this activity for a recipient or other entity?"
            name="activityRecipientType"
            fieldSetWrapper
            requiredText="*"
          >
            <Radio
              id="category-recipient"
              name="activityRecipientType"
              label="Recipient"
              value="recipient"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify recipient or other entity' })}
              required
            />
            <Radio
              id="category-other-entity"
              name="activityRecipientType"
              label="Other entity"
              value="other-entity"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify recipient or other entity' })}
            />
          </FormItem>
        </div>
        <div className="margin-top-2">
          <FormItem
            label={recipientLabel}
            name="activityRecipients"
            requiredText="*"
          >
            <MultiSelect
              name="activityRecipients"
              disabled={disableRecipients}
              control={control}
              valueProperty="activityRecipientId"
              labelProperty="name"
              simple={false}
              required="Please select at least one recipient or other entity"
              options={selectedRecipients}
              placeholderText={placeholderText}
            />
          </FormItem>
        </div>
        <div className="margin-top-2">
          <FormItem
            label="Collaborating Specialists"
            name="collaborators"
            required={false}
            requiredText="*"
          >
            <MultiSelect
              name="collaborators"
              control={control}
              required={false}
              valueProperty="id"
              labelProperty="name"
              simple={false}
              placeholderText={placeholderText}
              options={collaborators.map((user) => ({ value: user.id, label: user.name }))}
            />
          </FormItem>
        </div>
        <div className="margin-top-2">
          <FormItem
            label="Target Populations addressed. You may choose more than one."
            name="targetPopulations"
            required
            requiredText="*"
          >
            <MultiSelect
              name="targetPopulations"
              control={control}
              required="Please select at least one target population"
              options={targetPopulations.map((tp) => ({ value: tp, label: tp, isDisabled: tp === '--------------------' }))}
              placeholderText="- Select -"
            />
          </FormItem>
        </div>
      </Fieldset>
      <Fieldset className="smart-hub--report-legend margin-top-4" legend="Reason for Activity">
        <div id="reasons" />
        <div className="margin-top-2">
          <FormItem
            label="Who requested this activity? Use &quot;Regional Office&quot; for TTA not requested by recipient."
            name="requester"
            fieldSetWrapper
            requiredText="*"
          >
            <Radio
              id="recipientRequest"
              name="requester"
              label="Recipient"
              value="recipient"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify recipient or regional office' })}
            />
            <Radio
              id="requestorRegionalOffice"
              name="requester"
              label="Regional Office"
              value="regionalOffice"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify recipient or regional office' })}
            />
          </FormItem>
        </div>
        <div className="margin-top-2">
          <FormItem
            label="Reasons"
            name="reason"
            requiredText="*"
          >
            <div className="usa-hint">
              Select at least one
            </div>
            <MultiSelect
              name="reason"
              control={control}
              options={reasons.map((reason) => ({ value: reason, label: reason }))}
              placeholderText={placeholderText}
            />
          </FormItem>
        </div>
      </Fieldset>
      <Fieldset className="smart-hub--report-legend margin-top-4" legend="Activity date">
        <div id="date" />
        <div>
          <Grid row>
            <Grid col={8}>
              <FormItem
                label="Start Date"
                name="startDate"
                id="startDate-label"
                requiredText="*"
              >
                <div
                  className="usa-hint"
                >
                  mm/dd/yyyy
                </div>
                <ControlledDatePicker
                  control={control}
                  name="startDate"
                  value={startDate}
                  setEndDate={setEndDate}
                  maxDate={endDate}
                  isStartDate
                />
              </FormItem>
            </Grid>
          </Grid>
          <Grid row>
            <Grid col={8}>
              <FormItem
                label="End Date"
                name="endDate"
                id="endDate-label"
                requiredText="*"
              >
                <div
                  className="usa-hint"
                >
                  mm/dd/yyyy
                </div>
                <ControlledDatePicker
                  control={control}
                  name="endDate"
                  value={endDate}
                  minDate={startDate}
                  key={endDateKey}
                />
              </FormItem>
            </Grid>
          </Grid>
          <Grid row>
            <Grid col={5}>
              <FormItem
                label="Duration in hours (round to the nearest half hour)"
                name="duration"
                requiredText="*"
              >
                <TextInput
                  id="duration"
                  name="duration"
                  type="number"
                  min={0}
                  step={0.5}
                  inputRef={
                    register({
                      required: 'Please enter the duration of the activity',
                      valueAsNumber: true,
                      pattern: { value: /^\d+(\.[0,5]{1})?$/, message: 'Duration must be rounded to the nearest half hour' },
                      min: { value: 0, message: 'Duration can not be negative' },
                    })
                  }
                />
              </FormItem>
            </Grid>
          </Grid>
        </div>
      </Fieldset>
      <Fieldset className="smart-hub--report-legend margin-top-4" legend="Training or Technical Assistance">
        <div id="tta" />
        <div className="margin-top-2">
          <FormItem
            label="What TTA was provided"
            name="ttaType"
            fieldSetWrapper
            requiredText="*"
          >
            {renderCheckbox('ttaType', 'training', 'Training', 'Please specify the type of TTA provided')}
            {renderCheckbox('ttaType', 'technical-assistance', 'Technical Assistance', 'Please specify the type of TTA provided')}
          </FormItem>
        </div>
        <div className="margin-top-2">
          <FormItem
            label="How was the activity conducted?"
            name="deliveryMethod"
            fieldSetWrapper
            requiredText="*"
          >
            <Radio
              id="delivery-method-virtual"
              name="deliveryMethod"
              label="Virtual"
              value="virtual"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify how the activity was conducted' })}
            />
            <Radio
              id="delivery-method-in-person"
              name="deliveryMethod"
              label="In Person"
              value="in-person"
              className="smart-hub--report-checkbox"
              inputRef={register({ required: 'Please specify how the activity was conducted' })}
            />
          </FormItem>
          <div aria-live="polite">
            {isVirtual && (
            <div className="margin-top-2 smart-hub--virtual-delivery-group">
              <FormItem
                label="Please specify how the virtual event was conducted."
                name="virtualDeliveryType"
                fieldSetWrapper
                requiredText="*"
              >
                <Radio
                  id="virtual-deliver-method-video"
                  name="virtualDeliveryType"
                  label="Video"
                  value="video"
                  className="smart-hub--report-checkbox"
                  inputRef={register({ required: 'Please specify how the virtual event was conducted' })}
                />
                <Radio
                  id="virtual-deliver-method-telephone"
                  name="virtualDeliveryType"
                  label="Telephone"
                  value="telephone"
                  className="smart-hub--report-checkbox"
                  inputRef={register({ required: 'Please specify how the virtual event was conducted' })}
                />
              </FormItem>
            </div>
            )}
          </div>
        </div>
      </Fieldset>
      <Fieldset className="smart-hub--report-legend margin-top-4" legend="Participants">
        <div id="other-participants" />
        <div className="margin-top-2">
          <FormItem
            label={participantsLabel}
            name="participants"
            requiredText="*"
          >
            <MultiSelect
              name="participants"
              control={control}
              placeholderText={placeholderText}
              options={
              participants.map((participant) => ({ value: participant, label: participant }))
            }
            />
          </FormItem>
        </div>
        <div>
          <FormItem
            label="Number of participants involved"
            name="numberOfParticipants"
            requiredText="*"
          >
            <Grid row gap>
              <Grid col={5}>
                <TextInput
                  id="numberOfParticipants"
                  name="numberOfParticipants"
                  type="number"
                  min={1}
                  inputRef={
                    register({
                      required: 'Please enter the number of participants involved in the activity',
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: 'Number of participants can not be zero or negative',
                      },
                    })
                  }
                />
              </Grid>
            </Grid>
          </FormItem>
          <Fieldset className="smart-hub--report-legend margin-top-4" legend="Context">
            <Label htmlFor="context">Provide background or context for this activity</Label>
            <div className="smart-hub--text-area__resize-vertical margin-top-1">
              <HookFormRichEditor ariaLabel="Context" name="context" id="context" />
            </div>
          </Fieldset>
        </div>
      </Fieldset>
    </>
  );
};

ActivitySummary.propTypes = {
  collaborators: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
    }),
  ).isRequired,
  recipients: PropTypes.shape({
    grants: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        grants: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            activityRecipientId: PropTypes.number.isRequired,
          }),
        ),
      }),
    ),
    otherEntities: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        activityRecipientId: PropTypes.number.isRequired,
      }),
    ),
  }).isRequired,
};

const sections = [
  {
    title: 'Who was the activity for?',
    anchor: 'activity-for',
    items: [
      { label: 'Recipient or other entity', name: 'activityRecipientType', sort: true },
      { label: 'Activity Participants', name: 'activityRecipients', path: 'name' },
      {
        label: 'Collaborating specialists', name: 'collaborators', path: 'name', sort: true,
      },
      { label: 'Target Populations addressed', name: 'targetPopulations', sort: true },
    ],
  },
  {
    title: 'Reason for activity',
    anchor: 'reasons',
    items: [
      { label: 'Requested by', name: 'requester' },
      { label: 'Reasons', name: 'reason', sort: true },
    ],
  },
  {
    title: 'Activity date',
    anchor: 'date',
    items: [
      { label: 'Start date', name: 'startDate' },
      { label: 'End date', name: 'endDate' },
      { label: 'Duration', name: 'duration' },
    ],
  },
  {
    title: 'Training or Technical Assistance',
    anchor: 'tta',
    items: [
      { label: 'TTA Provided', name: 'ttaType' },
      { label: 'Conducted', name: 'deliveryMethod' },
    ],
  },
  {
    title: 'Other participants',
    anchor: 'other-participants',
    items: [
      { label: 'Recipient participants', name: 'participants', sort: true },
      { label: 'Number of participants', name: 'numberOfParticipants' },
    ],
  },
];

const ReviewSection = () => {
  const { watch } = useFormContext();
  const {
    context,
    calculatedStatus,
  } = watch();

  const canEdit = reportIsEditable(calculatedStatus);
  return (
    <>
      <ReviewPage sections={sections} path="activity-summary" />
      <Section
        hidePrint={isUndefined(context)}
        key="context"
        basePath="goals-objectives"
        anchor="context"
        title="Context"
        canEdit={canEdit}
      >
        <HtmlReviewItem
          label="Context"
          name="context"
        />
      </Section>
    </>
  );
};

export default {
  position: 1,
  label: 'Activity summary',
  path: 'activity-summary',
  reviewSection: () => <ReviewSection />,
  review: false,
  render: (additionalData) => {
    const { recipients, collaborators } = additionalData;
    return (
      <ActivitySummary
        recipients={recipients}
        collaborators={collaborators}
      />
    );
  },
};
