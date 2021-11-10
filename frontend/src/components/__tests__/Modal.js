/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import React, { useRef } from 'react';
import {
  render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalToggleButton } from '@trussworks/react-uswds';
import Modal from '../Modal';

const ModalComponent = (
  onOk = () => { },
  modalIdValue = 'TestReportModal',
  title = 'Test Report Modal',
  okButtonText = 'Ok',
  okButtonAriaLabel = 'This button will ok the modal action.',
  showOkButton = true,
  cancelButtonText = 'Cancel',
  showCloseX = false,
  isLarge = false,
) => {
  const modalRef = useRef();

  return (
    <div>
      <ModalToggleButton modalRef={modalRef} opener>Open</ModalToggleButton>
      <ModalToggleButton modalRef={modalRef} closer>Close</ModalToggleButton>
      <Modal
        modalRef={modalRef}
        onOk={onOk}
        modalId={modalIdValue}
        title={title}
        okButtonText={okButtonText}
        okButtonAriaLabel={okButtonAriaLabel}
        showOkButton={showOkButton}
        cancelButtonText={cancelButtonText}
        showCloseX={showCloseX}
        isLarge={isLarge}
      >
        <div>
          Are you sure you want to perform this action?
        </div>
      </Modal>
    </div>
  );
};

describe('Modal', () => {
  it('renders correctly', async () => {
    render(<ModalComponent />);
    expect(await screen.findByRole('heading', { name: /test report modal/i, hidden: true })).toBeVisible();
    expect(await screen.findByText(/are you sure you want to perform this action\?/i)).toBeVisible();
    expect(await screen.findByRole('button', { name: /cancel/i })).toBeVisible();
    expect(await screen.findByRole('button', { name: /this button will ok the modal action\./i })).toBeVisible();
  });

  it('correctly hides and shows', async () => {
    render(<ModalComponent />);

    // Defaults modal to hidden.
    let modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-hidden');

    // Open modal.
    const button = await screen.findByText('Open');
    userEvent.click(button);

    // Check modal is visible.
    modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-visible');
  });

  it('exits when escape key is pressed', async () => {
    render(<ModalComponent />);

    // Open modal.
    const button = await screen.findByText('Open');
    userEvent.click(button);

    // Modal is visible.
    let modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-visible');

    // Press ESC.
    userEvent.type(modalElement, '{esc}', { skipClick: true });

    // Check Modal is hidden.
    modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-hidden');
  });

  it('does not escape when any other key is pressed', async () => {
    render(<ModalComponent />);

    // Open modal.
    const button = await screen.findByText('Open');
    userEvent.click(button);

    // Modal is open.
    let modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-visible');

    // Press ENTER.
    userEvent.type(modalElement, '{enter}', { skipClick: true });

    // Modal is still open.
    modalElement = document.querySelector('#popup-modal');
    expect(modalElement.firstChild).toHaveClass('is-visible');
  });
});
