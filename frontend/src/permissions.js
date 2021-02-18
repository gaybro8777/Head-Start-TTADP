import _ from 'lodash';
import { SCOPE_IDS } from './Constants';

/**
 * Search the user's permissions for an ADMIN scope
 * @param {*} - user object
 * @returns {boolean} - True if the user is an admin, false otherwise
 */
const isAdmin = (user) => {
  const permissions = _.get(user, 'permissions');
  return permissions && permissions.find(
    (p) => p.scopeId === SCOPE_IDS.ADMIN,
  ) !== undefined;
};

/**
 * Return all regions that user has a minimum of read access to.
 * All permissions that qualify this criteria are:
 * Admin
 * Read Activity Reports
 * Read Write Activity Reports
 * @param {*} - user object
 * @returns {array} - An array of integers, where each integer signifies a region.
 */

export const allRegionsUserHasPermissionTo = (user) => {
  const permissions = _.get(user, 'permissions');

  if (!permissions) return [];

  const minPermissions = [
    SCOPE_IDS.ADMIN,
    SCOPE_IDS.READ_ACTIVITY_REPORTS,
    SCOPE_IDS.READ_WRITE_ACTIVITY_REPORTS,
  ];

  const regions = [];
  permissions.forEach((perm) => {
    if (minPermissions.includes(perm.scopeId)) {
      regions.push(perm.regionId);
    }
  });

  return _.uniq(regions);
};

export default isAdmin;
