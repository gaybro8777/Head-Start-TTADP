import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form/dist/index.ie11';
import Objective from '../Objective';

const RenderObjective = ({
  // eslint-disable-next-line react/prop-types
  defaultObjective, onRemove = () => {},
}) => {
  const hookForm = useForm({
    defaultValues: { objective: defaultObjective },
  });

  hookForm.register('goals');
  hookForm.register('objective');
  const objective = hookForm.watch('objective');

  const onUpdate = (obj) => {
    hookForm.setValue('objective', obj);
  };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...hookForm}>
      <Objective
        objective={objective}
        onRemove={onRemove}
        onUpdate={onUpdate}
        parentLabel="goals"
        objectiveAriaLabel="1 on goal 1"
        goalIndex={0}
        objectiveIndex={0}
      />
    </FormProvider>
  );
};

describe('Objective', () => {
  it('opens in edit mode if "ttaProvided" is blank', async () => {
    render(<RenderObjective defaultObjective={{ ttaProvided: '<p></p>', title: 'title', status: 'status' }} />);
    const save = await screen.findByText('Save Objective');
    expect(save).toBeVisible();
  });

  it('opens in edit mode if "title" is blank', async () => {
    render(<RenderObjective defaultObjective={{ ttaProvided: 'tta', title: '', status: 'status' }} />);
    const save = await screen.findByText('Save Objective');
    expect(save).toBeVisible();
  });

  describe('in edit mode', () => {
    it('focuses the title field', async () => {
      render(<RenderObjective defaultObjective={{ ttaProvided: 'tta', title: '', status: 'status' }} />);
      const title = await screen.findByLabelText('Objective (Required)');
      expect(document.activeElement).toEqual(title);
    });

    it('saves without explicitly clicking the save button', async () => {
      const objective = {
        title: '', ttaProvided: 'test', status: 'Not Started',
      };
      render(<RenderObjective defaultObjective={objective} />);
      const title = await screen.findByLabelText('Objective (Required)');
      userEvent.type(title, 'this is a test');
      const titleWithText = await screen.findByDisplayValue('this is a test');
      expect(titleWithText).toBeVisible();
    });

    it('save does not work if "objective" and "TTA Provided" are empty', async () => {
      render(<RenderObjective defaultObjective={{}} />);
      const save = await screen.findByText('Save Objective');
      expect(save).toBeVisible();

      userEvent.click(save);
      expect(await screen.findByText('Save Objective')).toBeVisible();
    });

    it('save works when "objective" and "TTA Provided" have values', async () => {
      const objective = {
        title: '', ttaProvided: 'test', status: 'Not Started',
      };
      render(<RenderObjective defaultObjective={objective} />);
      const save = await screen.findByText('Save Objective');
      expect(save).toBeVisible();

      const title = await screen.findByLabelText('Objective (Required)');
      userEvent.type(title, 'this is a test');

      userEvent.click(save);
      expect(await screen.findByTestId('tag')).toBeVisible();
    });

    it('calls onRemove when the cancel button is clicked with an empty objective', async () => {
      const onRemove = jest.fn();
      render(<RenderObjective defaultObjective={{ title: '', ttaProvided: '<p></p>', status: 'Not Started' }} onRemove={onRemove} />);
      const cancel = await screen.findByRole('button', { name: 'Cancel update of objective 1 on goal 1' });
      userEvent.click(cancel);
      expect(onRemove).toHaveBeenCalled();
    });

    it('cancels any edits if the objective is not empty', async () => {
      const onRemove = jest.fn();
      render(<RenderObjective defaultObjective={{ title: 'title', ttaProvided: '<p></p>', status: 'Not Started' }} onRemove={onRemove} />);
      const text = await screen.findByLabelText('Objective (Required)');
      userEvent.type(text, 'test');
      const cancel = await screen.findByRole('button', { name: 'Cancel update of objective 1 on goal 1' });
      userEvent.click(cancel);

      expect(await screen.findByText('title')).toBeVisible();
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('in display mode', () => {
    it('displays the objective', async () => {
      const objective = {
        title: 'title', ttaProvided: 'test', status: 'Not Started',
      };
      render(<RenderObjective defaultObjective={objective} />);
      const title = await screen.findByText('title');
      const status = await screen.findByText('Not Started');

      expect(title).toBeVisible();
      expect(status).toBeVisible();
    });

    it('can be removed via the context menu', async () => {
      const onRemove = jest.fn();
      const objective = {
        title: 'title', ttaProvided: 'test', status: 'Not Started',
      };
      render(<RenderObjective defaultObjective={objective} onRemove={onRemove} />);
      const menu = await screen.findByRole('button', { name: 'Edit or delete objective 1 on goal 1' });
      userEvent.click(menu);

      const deleteButton = await screen.findByText('Delete');
      userEvent.click(deleteButton);
      expect(onRemove).toHaveBeenCalled();
    });

    it('can be switched to edit mode via the context menu', async () => {
      const objective = {
        title: 'title', ttaProvided: 'test', status: 'Not Started',
      };
      render(<RenderObjective defaultObjective={objective} />);
      const menu = await screen.findByRole('button', { name: 'Edit or delete objective 1 on goal 1' });
      userEvent.click(menu);

      const edit = await screen.findByText('Edit');
      userEvent.click(edit);
      const save = await screen.findByText('Save Objective');
      expect(save).toBeVisible();
      await screen.findByText('Cancel');
    });
  });
});
