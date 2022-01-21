import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import useSpellCheck from '../../hooks/useSpellCheck';

export default function FilterSelect({
  onApply,
  labelText,
  inputId,
  options,
  selectedValues,
  mapByValue,
}) {
  /**
   * unfortunately, given our support for ie11, we can't
   * upgrade to react-select v5, which support a spellcheck
   * attribute. Here is an awkward solution I've concocted
   * in it's stead.
  */

  useSpellCheck(inputId);

  const key = mapByValue ? 'value' : 'label';

  const value = [selectedValues].flat().map((selection) => (
    options.find((option) => option[key] === selection)
  ));

  const styles = {
    container: (provided, state) => {
      // To match the focus indicator provided by uswds
      const outline = state.isFocused ? '0.25rem solid #2491ff;' : '';
      return {
        ...provided,
        outline,
        height: 'auto',
        padding: 0,
      };
    },
    control: (provided, state) => {
      const selected = state.getValue();
      return {
        ...provided,
        background: state.isFocused || selected.length ? 'white' : 'transparent',
        border: 'none',
        borderRadius: 0,
        boxShadow: '0',
        // Match uswds disabled style
        opacity: state.isDisabled ? '0.7' : '1',

        overflow: state.isFocused ? 'visible' : 'hidden',
        position: !state.isFocused ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: state.isFocused && selected.length ? 'auto' : 0,
      };
    },
    indicatorsContainer: (provided) => ({
      ...provided,
      display: 'inline',
      // The arrow dropdown icon is too far to the right, this pushes it back to the left
      marginRight: '4px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: (provided) => ({
      ...provided,
      zIndex: 2,
    }),
    multiValue: (provided) => ({ ...provided }),
    multiValueLabel: (provided) => ({ ...provided }),
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '100%',
    }),
  };

  const onChange = (selected) => {
    onApply(selected.map((selection) => selection[key]));
  };

  return (
    <Select
      placeholder={labelText}
      aria-label={labelText}
      inputId={inputId}
      onChange={onChange}
      options={options}
      styles={styles}
      components={{
        DropdownIndicator: null,
      }}
      className="usa-select"
      closeMenuOnSelect={false}
      value={value}
      isMulti
    />
  );
}

const option = PropTypes.shape({
  label: PropTypes.string,
  value: PropTypes.number,
});

FilterSelect.propTypes = {
  onApply: PropTypes.func.isRequired,
  labelText: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(option).isRequired,
  inputId: PropTypes.string.isRequired,
  selectedValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  mapByValue: PropTypes.bool,
};

FilterSelect.defaultProps = {
  mapByValue: false,
};