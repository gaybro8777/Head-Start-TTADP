import { Op } from 'sequelize';

import {
  User,
  Permission,
  UserValidationStatus,
} from '../models';

export const userAttributes = [
  'id',
  'name',
  'hsesUserId',
  'hsesUsername',
  'hsesAuthorities',
  'email',
  'phoneNumber',
  'homeRegionId',
  'role',
  'lastLogin',
  'flags',
];

export async function userById(userId) {
  return User.findOne({
    attributes: userAttributes,
    where: {
      id: {
        [Op.eq]: userId,
      },
    },
    include: [
      { model: Permission, as: 'permissions', attributes: ['userId', 'scopeId', 'regionId'] },
      { model: UserValidationStatus, as: 'validationStatus', attributes: ['userId', 'type', 'validatedAt'] },
    ],
    order: [
      [{ model: Permission, as: 'permissions' }, 'regionId', 'ASC'],
    ],
  });
}

export async function userByEmail(email) {
  return User.findOne({
    attributes: ['id'],
    where: {
      email: { [Op.iLike]: email },
    },
  });
}

export async function usersWithPermissions(regions, scopes) {
  return User.findAll({
    attributes: ['id', 'name'],
    raw: true,
    where: {
      [Op.and]: [
        { '$permissions.scopeId$': scopes },
        { '$permissions.regionId$': regions },
      ],
    },
    include: [
      { model: Permission, as: 'permissions', attributes: [] },
    ],
  });
}

/**
 * @param {User} user
 */
export async function userEmailIsVerified(user) {
  return user.validationStatus.some((status) => status.type === 'email' && status.validatedAt);
}

/**
 * @param {number} userId
 */
export async function userEmailIsVerifiedByUserId(userId) {
  const user = await userById(userId);
  return user
    ? userEmailIsVerified(user)
    : false;
}
