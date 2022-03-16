import React from 'react';
import PropTypes from 'prop-types';
import {
  Button, Modal as TrussWorksModal, ModalHeading, ModalFooter, ButtonGroup, ModalToggleButton,
} from '@trussworks/react-uswds';
import './Modal.css';

const Modal = ({
  modalRef,
  modalId,
  onOk,
  title,
  okButtonText,
  okButtonAriaLabel,
  showOkButton,
  cancelButtonText,
  showCloseX,
  isLarge,
  children,
  okButtonCss,
  cancelButtonCss,
  showTitleRequired,
  secondaryOkButtonText,
  onSecondaryOk,
  hideCancelButton,

}) => (
  <div className={`popup-modal ${showCloseX ? 'show-close-x' : ''}`}>
    <TrussWorksModal
      ref={modalRef}
      id={`${modalId}`}
      isLarge={isLarge}
      aria-labelledby={`${modalId}-heading`}
    >
      <ModalHeading className="font-sans" id={`${modalId}-heading`}>
        {title}
        {showTitleRequired ? <span className="smart-hub--form-required"> (required)</span> : null }
      </ModalHeading>
      <div>
        {children}
      </div>
      <ModalFooter>
        <ButtonGroup>
          {
            !hideCancelButton
              ? (
                <ModalToggleButton className={cancelButtonCss} data-focus="true" type="button" modalRef={modalRef} closer>
                  {cancelButtonText}
                </ModalToggleButton>
              )
              : null
          }
          {
            showOkButton
              ? (
                <Button className={okButtonCss || 'usa-button usa-button--secondary usa-button'} type="button" aria-label={okButtonAriaLabel} modalRef={modalRef} onClick={onOk}>
                  {okButtonText}
                </Button>
              )
              : null
          }
          {
            secondaryOkButtonText
              ? (
                <Button className={okButtonCss || 'usa-button usa-button--secondary usa-button'} type="button" aria-label={okButtonAriaLabel} modalRef={modalRef} onClick={onSecondaryOk}>
                  {secondaryOkButtonText}
                </Button>
              )
              : null
          }
        </ButtonGroup>
      </ModalFooter>
    </TrussWorksModal>
  </div>
);

Modal.propTypes = {
  modalRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape(),
  ]).isRequired,
  modalId: PropTypes.string.isRequired,
  onOk: PropTypes.func,
  title: PropTypes.string.isRequired,
  okButtonText: PropTypes.string,
  okButtonAriaLabel: PropTypes.string,
  showOkButton: PropTypes.bool,
  cancelButtonText: PropTypes.string,
  showCloseX: PropTypes.bool,
  isLarge: PropTypes.bool,
  children: PropTypes.node.isRequired,
  okButtonCss: PropTypes.string,
  cancelButtonCss: PropTypes.string,
  showTitleRequired: PropTypes.bool,
  secondaryOkButtonText: PropTypes.string,
  onSecondaryOk: PropTypes.string,
  hideCancelButton: PropTypes.bool,
};

Modal.defaultProps = {
  onOk: () => { },
  okButtonAriaLabel: null,
  okButtonText: '',
  showCloseX: false,
  showOkButton: true,
  isLarge: false,
  cancelButtonText: 'Cancel',
  okButtonCss: null,
  cancelButtonCss: null,
  showTitleRequired: false,
  secondaryOkButtonText: null,
  onSecondaryOk: () => { },
  hideCancelButton: false,
};

export default Modal;
