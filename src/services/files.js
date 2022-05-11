import {
  ActivityReportFile,
  ActivityReportObjectiveFile,
  File,
  ObjectiveFile,
  ObjectiveTemplateFile,
} from '../models';
import { FILE_STATUSES } from '../constants';

const { UPLOADING } = FILE_STATUSES;
const deleteFile = async (id) => File.destroy({
  where: { id },
});
const deleteActivityReportFile = async (id) => ActivityReportFile.destroy({
  where: { id },
});
const deleteActivityReportObjectiveFile = async (id) => ActivityReportObjectiveFile.destroy({
  where: { id },
});
const deleteObjectiveFile = async (id) => ObjectiveFile.destroy({
  where: { id },
});
const deleteObjectiveTemplateFile = async (id) => ObjectiveTemplateFile.destroy({
  where: { id },
});

const getFileById = async (id) => File.findOne({ where: { id } });
const getActivityReportFilesById = async (reportId) => ActivityReportFile.findAll({
  where: { activityReportId: reportId },
  include: [
    {
      model: File,
      as: 'file',
      required: true,
    },
  ],
});
const getActivityReportObjectiveFilesById = async (
  reportId,
  objectiveId,
) => ActivityReportObjectiveFile.findAll({
  where: { activityReportId: reportId, objectiveId },
  include: [
    {
      model: File,
      as: 'file',
      required: true,
    },
  ],
});
const getObjectiveFilesById = async (objectiveId) => ObjectiveFile.findAll({
  where: { objectiveId },
  include: [
    {
      model: File,
      as: 'file',
      required: true,
    },
  ],
});
const getObjectiveTemplateFilesById = async (objectiveTemplateId) => ObjectiveTemplateFile.findAll({
  where: { objectiveTemplateId },
  include: [
    {
      model: File,
      as: 'file',
      required: true,
    },
  ],
});

const updateStatus = async (fileId, fileStatus) => {
  let file;
  try {
    file = await File.update({ status: fileStatus }, { where: { id: fileId } });
    return file.dataValues;
  } catch (error) {
    return error;
  }
};

const createActivityReportFileMetaData = async (
  originalFileName,
  s3FileName,
  reportId,
  fileSize,
) => {
  const newFile = {
    // activityReportId: reportId,
    originalFileName,
    key: s3FileName,
    status: UPLOADING,
    fileSize,
  };
  let file;
  try {
    file = await File.create(newFile);
    await ActivityReportFile.create({ activityReportId: reportId, fileId: file.id });
    return file.dataValues;
  } catch (error) {
    return error;
  }
};

const createActivityReportObjectiveFileMetaData = async (
  originalFileName,
  s3FileName,
  reportId,
  objectiveId,
  fileSize,
) => {
  const newFile = {
    // activityReportId: reportId,
    originalFileName,
    key: s3FileName,
    status: UPLOADING,
    fileSize,
  };
  let file;
  try {
    file = await File.create(newFile);
    await ActivityReportFile.create({ activityReportId: reportId, objectiveId, fileId: file.id });
    return file.dataValues;
  } catch (error) {
    return error;
  }
};

const createObjectiveFileMetaData = async (
  originalFileName,
  s3FileName,
  objectiveId,
  fileSize,
) => {
  const newFile = {
    // activityReportId: reportId,
    originalFileName,
    key: s3FileName,
    status: UPLOADING,
    fileSize,
  };
  let file;
  try {
    file = await File.create(newFile);
    await ObjectiveFile.create({ objectiveId, fileId: file.id });
    return file.dataValues;
  } catch (error) {
    return error;
  }
};

export {
  deleteFile,
  deleteActivityReportFile,
  deleteActivityReportObjectiveFile,
  deleteObjectiveFile,
  deleteObjectiveTemplateFile,
  getFileById,
  getActivityReportFilesById,
  getActivityReportObjectiveFilesById,
  getObjectiveFilesById,
  getObjectiveTemplateFilesById,
  updateStatus,
  createActivityReportFileMetaData,
  createActivityReportObjectiveFileMetaData,
  createObjectiveFileMetaData,
};
