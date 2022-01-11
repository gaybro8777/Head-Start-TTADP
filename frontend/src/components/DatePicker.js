/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DatePicker as RawDatePicker,
} from '@trussworks/react-uswds';
import moment from 'moment';

import { DATE_DISPLAY_FORMAT } from '../Constants';

export const DATE_PICKER_DATE_FORMAT = 'YYYY-MM-DD';

// this is just a pass through component to simplify the date formats not
// matching and the way the USDWS is weird about the change/values not all matching
// we are also doing a little of our validation on the side
export default function DatePicker(
  {
    onChange,
    defaultValue,
    minDate,
    maxDate,
    datePickerKey,
    ...props
  },
) {
  const [error, setError] = useState('');

  const tomorrow = useMemo(() => moment().add(1, 'days').format(DATE_PICKER_DATE_FORMAT), []);

  const onDatePickerChange = (date) => {
    // we want to allow "" as a valid thing to enter
    if (!date) {
      onChange(date);
      return;
    }

    // otherwise we go through the validation steps
    const dateAsMoment = moment(date, DATE_DISPLAY_FORMAT);
    const minDateAsMoment = moment(minDate, DATE_DISPLAY_FORMAT);
    const maxDateAsMoment = maxDate ? moment(maxDate, DATE_DISPLAY_FORMAT) : moment().add(1, 'days');

    if (!dateAsMoment.isValid()) {
      setError(`Please enter a valid date after ${minDate}`);
      return;
    }

    if (dateAsMoment.isBefore(minDateAsMoment)) {
      setError(`Please enter a date after ${minDate}`);
      return;
    }

    if (dateAsMoment.isAfter(maxDateAsMoment)) {
      setError(`Please enter a date before ${maxDate || 'today'}`);
      return;
    }

    onChange(date);
  };

  useEffect(() => {
    setError('');
  }, [defaultValue]);

  const formattedDefaultValue = moment(
    defaultValue, DATE_DISPLAY_FORMAT,
  ).format(DATE_PICKER_DATE_FORMAT);

  const formattedMaxDate = maxDate
    ? moment(maxDate, DATE_DISPLAY_FORMAT).format(DATE_PICKER_DATE_FORMAT) : tomorrow;
  const formattedMinDate = moment(minDate, DATE_DISPLAY_FORMAT).format(DATE_PICKER_DATE_FORMAT);

  return (
    <>
      {error && <span className="usa-error-message">{error}</span>}
      <RawDatePicker
        {...props}
        key={datePickerKey}
        maxDate={formattedMaxDate}
        minDate={formattedMinDate}
        defaultValue={formattedDefaultValue}
        onChange={onDatePickerChange}
      />
    </>
  );
}

DatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  datePickerKey: PropTypes.string,
};

DatePicker.defaultProps = {
  defaultValue: '',
  minDate: '09/02/2020',
  maxDate: '',
  datePickerKey: 'date-picker',
};
