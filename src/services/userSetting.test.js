import { USER_SETTINGS } from '../constants';
import db, { User, UserSetting } from '../models';
import {
  saveSettings,
  subscribeAll,
  unsubscribeAll,
  userSettingsById,
} from './userSetting';

describe('UserSetting service', () => {
  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    const ids = [9998, 9999];
    const now = new Date();

    const create = () => Promise.all(ids.map(async (id) => {
      await User.create({
        id,
        name: `user ${id}`,
        email: `user${id}@test.gov`,
        hsesUsername: `user.${id}`,
        hsesUserId: id,
        createdAt: now,
        updatedAt: now,
      });

      const defaultSettings = Object.values(USER_SETTINGS.EMAIL.KEYS).map((key) => ({
        userId: id,
        key,
        value: USER_SETTINGS.EMAIL.VALUES.MONTHLY_DIGEST,
        createdAt: now,
        updatedAt: now,
      }));

      return UserSetting.bulkCreate(defaultSettings);
    }));

    await create();
  });

  afterEach(async () => {
    await UserSetting.destroy({ where: { userId: [9998, 9999] } });
    await User.destroy({ where: { id: [9998, 9999] } });
  });

  describe('saveSettings', () => {
    const settings = [
      {
        key: USER_SETTINGS.EMAIL.KEYS.CHANGE_REQUESTED,
        value: USER_SETTINGS.EMAIL.VALUES.IMMEDIATELY,
      },
      {
        key: USER_SETTINGS.EMAIL.KEYS.SUBMITTED_FOR_REVIEW,
        value: USER_SETTINGS.EMAIL.VALUES.IMMEDIATELY,
      },
    ];

    it('saves the settings', async () => {
      await saveSettings(9998, settings);
      const found = await UserSetting.findAll({
        where: { userId: 9998, value: USER_SETTINGS.EMAIL.VALUES.IMMEDIATELY },
      });
      expect(found.length).toBe(2);
    });
  });

  describe('userSettingsById', () => {
    it('retrieves the correct settings', async () => {
      const settings = await userSettingsById(9998);
      expect(settings.length).toBe(4);
    });
  });

  describe('subscribeAll', () => {
    it('sets all email settings to immediate frequency', async () => {
      await subscribeAll(9998);
      const found = await UserSetting.findAll({
        where: { userId: 9998, value: USER_SETTINGS.EMAIL.VALUES.IMMEDIATELY },
      });
      expect(found.length).toBe(4);
    });
  });

  describe('unsubscribeAll', () => {
    it('sets all email settings to never frequency', async () => {
      await unsubscribeAll(9998);
      const found = await UserSetting.findAll({
        where: { userId: 9998, value: USER_SETTINGS.EMAIL.VALUES.NEVER },
      });
      expect(found.length).toBe(4);
    });
  });
});
