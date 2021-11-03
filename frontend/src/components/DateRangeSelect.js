import React from 'react';
import PropTypes from 'prop-types';
import './DateRangeSelect.css';
import moment from 'moment';
import ButtonSelect from './ButtonSelect';
import { DATETIME_DATE_FORMAT, DATE_FORMAT, DATE_OPTIONS } from './constants';

export function formatDateRange(format = {
  lastThirtyDays: false,
  yearToDate: false,
  withSpaces: false,
  forDateTime: false,
  sep: '-',
  string: '',
}) {
  const selectedFormat = format.forDateTime ? DATETIME_DATE_FORMAT : DATE_FORMAT;

  let { sep } = format;

  if (!format.sep) {
    sep = '-';
  }
  if (format.lastThirtyDays) {
    const today = moment();
    const thirtyDaysAgo = moment().subtract(30, 'days');

    if (format.withSpaces) {
      return `${thirtyDaysAgo.format(selectedFormat)} ${sep} ${today.format(selectedFormat)}`;
    }

    return `${thirtyDaysAgo.format(selectedFormat)}${sep}${today.format(selectedFormat)}`;
  }

  if (format.yearToDate) {
    const today = moment();
    const firstDayOfYear = moment().startOf('year');

    if (format.withSpaces) {
      return `${firstDayOfYear.format(selectedFormat)} ${sep} ${today.format(selectedFormat)}`;
    }

    return `${firstDayOfYear.format(selectedFormat)}${sep}${today.format(selectedFormat)}`;
  }

  if (format.string) {
    const dates = format.string.split('-');

    if (dates && dates.length > 1) {
      if (format.withSpaces) {
        return `${moment(dates[0], DATETIME_DATE_FORMAT).format(selectedFormat)} ${sep} ${moment(dates[1], DATETIME_DATE_FORMAT).format(selectedFormat)}`;
      }

      return `${moment(dates[0], DATETIME_DATE_FORMAT).format(selectedFormat)}${sep}${moment(dates[1], DATETIME_DATE_FORMAT).format(selectedFormat)}`;
    }
  }

  return '';
}
/*
  we are trying to kill one of the two functions, on apply or updateDateRange
  we can probably continue to pass in "on apply" and then handle that here
  we only want to pass in one method down the component tree at each level
*/

export default function DateRangeSelect(props) {
  const {
    onApply,
    selectedDateRangeOption,
    updateDateRange,
    dateRange,
    customDateRangeOption,
    styleAsSelect,
    initialValue,
    options,
  } = props;

  return (
    <ButtonSelect
      onApply={onApply}
      initialValue={initialValue}
      labelId="dateRangeOptionsLabel"
      labelText="Choose activity start date range."
      options={options}
      applied={selectedDateRangeOption}
      hasDateRange
      customDateRangeOption={customDateRangeOption}
      updateDateRange={updateDateRange}
      dateRange={dateRange}
      startDatePickerId="startDatePicker"
      endDatePickerId="endDatePicker"
      ariaName="date range options menu"
      styleAsSelect={styleAsSelect}
    />
  );
}

const optionProp = PropTypes.shape({
  label: PropTypes.string,
  value: PropTypes.number,
});

DateRangeSelect.propTypes = {
  onApply: PropTypes.func.isRequired,
  selectedDateRangeOption: PropTypes.number.isRequired,
  updateDateRange: PropTypes.func,
  dateRange: PropTypes.string.isRequired,
  customDateRangeOption: PropTypes.number.isRequired,
  styleAsSelect: PropTypes.bool.isRequired,
  initialValue: optionProp,
  options: PropTypes.arrayOf(optionProp),
};

DateRangeSelect.defaultProps = {
  updateDateRange: () => {},
  initialValue: {
    label: 'Last 30 Days',
    value: 1,
  },
  options: DATE_OPTIONS,
};
