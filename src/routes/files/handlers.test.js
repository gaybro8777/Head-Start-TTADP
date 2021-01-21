import { validate } from 'uuid';
import db, {
  File,
  ActivityReport,
  User,
  Permission,
} from '../../models';
import app from '../../app';
import s3Uploader from '../../lib/s3Uploader';
import SCOPES from '../../middleware/scopeConstants';

const request = require('supertest');

jest.mock('../../lib/s3Uploader');

const mockUser = {
  id: 200,
  homeRegionId: 1,
  permissions: [
    {
      userId: 200,
      regionId: 5,
      scopeId: SCOPES.READ_WRITE_REPORTS,
    },
    {
      userId: 200,
      regionId: 6,
      scopeId: SCOPES.READ_WRITE_REPORTS,
    },
  ],
};

const mockSession = jest.fn();
mockSession.userId = mockUser.id;

const reportObject = {
  activityRecipientType: 'grantee',
  status: 'draft',
  userId: mockUser.id,
  lastUpdatedById: mockUser.id,
  resourcesUsed: 'test',
};

describe('File Upload Handlers happy path', () => {
  let user;
  let report;
  let fileId;
  beforeAll(async () => {
    user = await User.create(mockUser, { include: [{ model: Permission, as: 'permissions' }] });
    report = await ActivityReport.create(reportObject);
  });
  afterAll(async () => {
    await File.destroy({ where: {} });
    await ActivityReport.destroy({ where: { } });
    await User.destroy({ where: { id: user.id } });
  });
  beforeEach(() => {
    s3Uploader.mockReset();
  });
  it('tests a file upload', async () => {
    await request(app)
      .post('/api/files')
      .field('reportId', report.dataValues.id)
      .attach('File', `${__dirname}/testfiles/testfile.pdf`)
      .expect(200)
      .then((res) => {
        fileId = res.body.id;
        expect(s3Uploader).toHaveBeenCalled();
      });
  });
  it('checks the metadata was uploaded to the database', async () => {
    const file = await File.findAll({ where: { id: fileId } });
    const uuid = file[0].dataValues.key.slice(0, -4);
    expect(file[0].dataValues.id).toBe(fileId);
    expect(file[0].dataValues.status).toBe('UPLOADED');
    expect(file[0].dataValues.originalFileName).toBe('testfile.pdf');
    expect(file[0].dataValues.activityReportId).toBe(report.dataValues.id);
    expect(validate(uuid)).toBe(true);
  });
});

describe('File Upload Handlers error handling', () => {
  let user;
  let report;
  beforeAll(async () => {
    user = await User.create(mockUser, { include: [{ model: Permission, as: 'permissions' }] });
    report = await ActivityReport.create(reportObject);
  });
  afterAll(async () => {
    await File.destroy({ where: {} });
    await ActivityReport.destroy({ where: { } });
    await User.destroy({ where: { id: user.id } });
    db.sequelize.close();
  });
  it('tests a file upload without a report id', async () => {
    await request(app)
      .post('/api/files')
      .attach('File', `${__dirname}/testfiles/testfile.pdf`)
      .expect(400, { error: 'requestId required' })
      .then(() => expect(s3Uploader).not.toHaveBeenCalled());
  });
  it('tests a file upload without a file', async () => {
    await request(app)
      .post('/api/files')
      .field('reportId', report.dataValues.id)
      .expect(400, { error: 'file required' })
      .then(() => expect(s3Uploader).not.toHaveBeenCalled());
  });
});
