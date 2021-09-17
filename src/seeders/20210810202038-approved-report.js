const recipients = [
  {
    id: 9998,
    activityReportId: 9999,
    grantId: 11,
    nonGranteeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const reports = [
  {
    id: 9999,
    additionalNotes: '',
    numberOfParticipants: 1,
    deliveryMethod: 'virtual',
    duration: 1,
    endDate: new Date('1971/01/01'),
    startDate: new Date('1970/01/01'),
    activityRecipientType: 'grantee',
    requester: 'grantee',
    status: 'approved',
    programTypes: ['Head Start (ages 3-5)'],
    reason: ['Child Incidents'],
    targetPopulations: ['Children with disabilities'],
    participants: ['Regional Head Start Association'],
    topics: ['coaching'],
    ttaType: ['training'],
    pageState: JSON.stringify({
      1: 'Complete', 2: 'Complete', 3: 'Complete', 4: 'Complete',
    }),
    userId: 1,
    lastUpdatedById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    context: '',
    approvingManagerId: 1,
    regionId: 1,
    managerNotes: '',
    nonECLKCResourcesUsed: ['http://www.website.com'],
    ECLKCResourcesUsed: ['https://www.website.com'],
    virtualDeliveryType: 'video',
    legacyId: null,
    imported: null,
  },
];

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert('ActivityReports', reports, { transaction });
      await queryInterface.bulkInsert('ActivityRecipients', recipients, { transaction });
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('ActivityReports', null, { transaction });
      await queryInterface.bulkDelete('ActivityRecipients', null, { transaction });
    });
  },
};