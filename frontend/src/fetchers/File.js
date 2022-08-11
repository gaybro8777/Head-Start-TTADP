import join from 'url-join';
import {
  destroy,
} from './index';

const fileUrl = join('/', 'api', 'files');

export const uploadFile = async (data) => {
  const res = await fetch(fileUrl, {
    method: 'POST',
    credentials: 'same-origin',
    body: data,
  });
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return res.json();
};

export const deleteObjectiveFile = async (fileId, objectiveId) => {
  const url = join(
    fileUrl,
    'o',
    objectiveId.toString(),
    fileId.toString(),
  );
  const res = await destroy(url);
  return res;
};

export const deleteReportFile = async (fileId, reportId) => {
  const url = join(
    fileUrl,
    'r',
    reportId.toString(),
    fileId.toString(),
  );
  const res = await destroy(url);
  return res;
};
