import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import './DropdownMenu.css';
import triangleDown from '../images/triange_down.png';

const ESCAPE_KEY_CODE = 27;

/**
 *
 * It's a pretty complicated looking component but right now
 * the only required props are:
 *
 * onApply - The function that is called when the apply button is pressed
 * children - The contents of the dropdown window pane
 * buttonText - The text for the main toggle button (for example, "Filters")
 *
 * @param {React Props} props
 * @returns rendered JSX Object
 */
export default function DropdownMenu({
  buttonText,
  buttonAriaLabel,
  styleAsSelect,
  canBlur,
  children,
  disabled,
  applyButtonText,
  applyButtonAria,
  onApply,
  className,
  onCancel,
  showCancel,
  cancelAriaLabel,
  forwardedRef,
  AlternateActionButton,
}) {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const menuContents = useRef();

  const onEscape = useCallback((event) => {
    if (event.keyCode === ESCAPE_KEY_CODE) {
      setMenuIsOpen(false);
    }
  }, [setMenuIsOpen]);

  useEffect(() => {
    document.addEventListener('keydown', onEscape, false);
    return () => {
      document.removeEventListener('keydown', onEscape, false);
      setMenuIsOpen(false);
    };
  }, [onEscape]);
  /**
   * Close the menu on blur, with some extenuating circumstance
   *
   * @param {Event} e
   * @returns void
   */
  const onBlur = (e) => {
    // if we're within the same menu, do nothing
    if (e.relatedTarget && menuContents.current.contains(e.relatedTarget)) {
      return;
    }

    if (canBlur(e)) {
      setMenuIsOpen(false);
    }
  };

  const onClick = () => {
    setMenuIsOpen(!menuIsOpen);
  };

  const onApplyClick = () => {
    if (onApply()) {
      setMenuIsOpen(false);
    }
  };

  const onCancelClick = () => {
    onCancel();
    setMenuIsOpen(false);
  };

  const buttonClasses = styleAsSelect ? 'usa-select' : 'usa-button';

  // needs position relative for the menu to work properly
  const classNames = `${className} smart-hub--dropdown-menu position-relative`;

  // just to make things a little less verbose below
  function ApplyButton() {
    return (
      <button
        type="button"
        className="usa-button smart-hub--button"
        onClick={onApplyClick}
        aria-label={applyButtonAria}
        onBlur={onBlur}
      >
        {applyButtonText}
      </button>
    );
  }

  return (
    <div ref={forwardedRef} className={classNames}>
      <button
        onClick={onClick}
        className={`${buttonClasses} smart-hub--dropdown-menu-toggle-btn display-flex margin-0 no-print`}
        aria-label={buttonAriaLabel}
        type="button"
        disabled={disabled}
        aria-pressed={menuIsOpen}
        onBlur={onBlur}
      >
        <span>{buttonText}</span>
        {!styleAsSelect && <img src={triangleDown} alt="" aria-hidden="true" /> }
      </button>

      <div className="smart-hub--dropdown-menu--contents no-print" ref={menuContents} hidden={!menuIsOpen || disabled}>
        {children}
        { showCancel
          ? (
            <div className="margin-top-1 desktop:display-flex flex-justify margin-y-2 margin-x-3 padding-x-3 desktop:padding-x-0">
              {AlternateActionButton}
              <div>
                <button
                  onClick={onCancelClick}
                  type="button"
                  className="usa-button usa-button--unstyled margin-right-2"
                  aria-label={cancelAriaLabel}
                >
                  Cancel
                </button>
                <ApplyButton />
              </div>
            </div>
          )
          : (
            <div className="margin-2 display-flex flex-justify">
              {AlternateActionButton}
              <ApplyButton />
            </div>
          ) }
      </div>
    </div>
  );
}

DropdownMenu.propTypes = {
  // the only required props are
  onApply: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  buttonText: PropTypes.string.isRequired,

  // these are all extra configuration
  buttonAriaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  styleAsSelect: PropTypes.bool,
  canBlur: PropTypes.func,
  applyButtonText: PropTypes.string,
  applyButtonAria: PropTypes.string,
  className: PropTypes.string,
  showCancel: PropTypes.bool,
  onCancel: PropTypes.func,
  cancelAriaLabel: PropTypes.string,
  forwardedRef: PropTypes.oneOfType([
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
    PropTypes.func,
  ]),
  AlternateActionButton: PropTypes.node,
};

function DefaultAlternateActionButton() {
  return <span />;
}

DropdownMenu.defaultProps = {
  className: 'margin-left-1',
  buttonAriaLabel: '',
  disabled: false,
  styleAsSelect: false,
  canBlur: () => true,
  applyButtonAria: 'Apply',
  applyButtonText: 'Apply',
  showCancel: false,
  cancelAriaLabel: 'Cancel',
  onCancel: () => {},
  forwardedRef: () => {},
  AlternateActionButton: DefaultAlternateActionButton,
};
