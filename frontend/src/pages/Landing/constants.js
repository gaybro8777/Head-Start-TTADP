import {
  regionFilter,
  endDateFilter,
  startDateFilter,
  grantNumberFilter,
  programSpecialistFilter,
  programTypeFilter,
  reasonsFilter,
  recipientFilter,
  reportIdFilter,
  specialistRoleFilter,
  stateCodeFilter,
  targetPopulationsFilter,
  topicsFilter,
  otherEntitiesFilter,
  participantsFilter,
} from '../../components/filter/activityReportFilters';

export const LANDING_BASE_FILTER_CONFIG = [
  startDateFilter,
  endDateFilter,
  grantNumberFilter,
  otherEntitiesFilter,
  participantsFilter,
  programSpecialistFilter,
  programTypeFilter,
  reasonsFilter,
  recipientFilter,
  reportIdFilter,
  specialistRoleFilter,
  stateCodeFilter,
  targetPopulationsFilter,
  topicsFilter,
];

export const LANDING_FILTER_CONFIG_WITH_REGIONS = [
  startDateFilter,
  endDateFilter,
  grantNumberFilter,
  otherEntitiesFilter,
  participantsFilter,
  programSpecialistFilter,
  programTypeFilter,
  reasonsFilter,
  recipientFilter,
  regionFilter,
  reportIdFilter,
  specialistRoleFilter,
  stateCodeFilter,
  targetPopulationsFilter,
  topicsFilter,
];
