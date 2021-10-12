/* eslint-disable no-plusplus */
/* eslint-disable quotes */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
import sequelize, { Op } from 'sequelize';
import cheerio from 'cheerio';
import faker from 'faker';
import {
  ActivityReport, User, Grantee, Grant, File, Permission,
} from '../models';

const SITE_ACCESS = 1;
const ADMIN = 2;
const READ_WRITE_REPORTS = 3;
const READ_REPORTS = 4;
const APPROVE_REPORTS = 5;

/**
 * processData script replaces user names, emails, grantee and grant information,
 * file names as well as certain html fields with generated data while preserving
 * existing relationships and non-PII data.
 *
 * Resulting anonymized database can then be restored in non-production environments.
 */

let realUsers = [];
let transformedUsers = [];
let transformedGrantees = [];
let realGrants = [];
let transformedGrants = [];
const hsesUsers = [
  {
    name: 'Adam Levin', hsesUsername: 'test.tta.adam', hsesUserId: '50783', email: 'adam@adhocteam.us',
  },
  {
    name: 'Angela Waner', hsesUsername: 'test.tta.angela', hsesUserId: '50599', email: 'angela@adhocteam.us',
  },
  {
    name: 'Krys Wisnaskas', hsesUsername: 'test.tta.krys', hsesUserId: '50491', email: 'krys@adhocteam.us',
  },
  {
    name: 'Matt Bevilacqua', hsesUsername: 'test.tta.mattb', hsesUserId: '50832', email: 'matt@adhocteam.us',
  },
  {
    name: 'Kelly Born', hsesUsername: 'test.tta.kelly', hsesUserId: '51113', email: 'kelly@adhocteam.us',
  },
  {
    name: 'Lauren Rodriguez', hsesUsername: 'test.tta.lauren', hsesUserId: '51130', email: 'lauren@adhocteam.us',
  },
  {
    name: 'Christine Nguyen', hsesUsername: 'test.tta.christine', hsesUserId: '50450', email: 'christine@adhocteam.us',
  },
  {
    name: 'Ryan Ahearn', hsesUsername: 'test.tta.ryan', hsesUserId: '48831', email: 'ryan@adhocteam.us',
  },
  {
    name: 'Maria Puhl', hsesUsername: 'test.tta.maria', hsesUserId: '51298', email: 'maria@adhocteam.us',
  },
  {
    name: 'Patrice Pascual', hsesUsername: 'test.tta.patrice', hsesUserId: '45594', email: 'patrice@adhocteam.us',
  },
  {
    name: 'Josh Salisbury', hsesUsername: 'test.tta.josh', hsesUserId: '50490', email: 'josh@adhocteam.us',
  },
  {
    name: 'Sarah-Jaine Szekeresh', hsesUsername: 'test.tta.sarah-jaine', hsesUserId: '51155', email: 'sarah-jaine@adhocteam.us',
  },
  {
    name: 'Rachel Miner', hsesUsername: 'test.tta.rachel', hsesUserId: '51352', email: 'rachel@adhocteam.us',
  },
  {
    name: 'Nathan Powell', hsesUsername: 'test.tta.nathan', hsesUserId: '51379', email: 'nathan.powell@adhocteam.us',
  },
];

const processHtml = async (input) => {
  if (!input) {
    return input;
  }

  const $ = cheerio.load(input);

  const getTextNodes = (elem) => (elem.type === 'text' ? [] : elem.contents().toArray()
    .filter((el) => el !== undefined)
    .reduce((acc, el) => acc.concat(...el.type === 'text' ? [el] : getTextNodes($(el))), []));

  getTextNodes($('html')).map((node) => $(node).replaceWith(
    $.html(node).trim() === '' // empty
      ? faker.random.words(0)
      : faker.random.words($.html(node).split(' ').length),
  ));

  return cheerio.load($.html(), null, false).html(); // html minus the html, head and body tags
};

const convertEmails = (emails) => {
  if (emails === null) {
    return emails;
  }
  const emailsArray = emails.split(', ');
  const convertedEmails = emailsArray.map((email) => {
    const foundUser = realUsers.find((user) => user.email === email);
    const userId = foundUser ? foundUser.id : null;
    if (userId) {
      const foundTransformedUser = transformedUsers.find((user) => user.id === userId);
      return foundTransformedUser ? foundTransformedUser.email : '';
    }
    return '';
  });

  return convertedEmails.join(', ');
};

const convertFileName = (fileName) => {
  if (fileName === null) {
    return fileName;
  }
  const extension = fileName.slice(fileName.indexOf('.'));
  return `${faker.system.fileName()}${extension}`;
};

const convertGranteeName = (granteesGrants) => {
  if (granteesGrants === null) {
    return granteesGrants;
  }

  const granteeGrantsArray = granteesGrants ? granteesGrants.split('\n') : [];

  const convertedGranteesGrants = granteeGrantsArray.map((granteeGrant) => {
    const granteeGrantArray = granteeGrant.split('|');
    const grant = granteeGrantArray.length > 1 ? granteeGrantArray[1].trim() : 'Missing Grant';

    const foundGrant = realGrants.find((g) => g.number === grant);
    // get ids of real grants and grantees;
    const granteeId = foundGrant ? foundGrant.granteeId : null;
    const grantId = foundGrant ? foundGrant.id : null;
    // find corresponding transformed grants and grantees
    const foundTransformedGrantee = transformedGrantees.find((g) => g.id === granteeId);
    const foundTransformedGrant = transformedGrants.find((g) => g.id === grantId);

    const transformedGranteeName = foundTransformedGrantee ? foundTransformedGrantee.name : 'Unknown Grantee';
    const transformedGrantNumber = foundTransformedGrant ? foundTransformedGrant.number : 'UnknownGrant';
    return `${transformedGranteeName} | ${transformedGrantNumber}`;
  });

  return convertedGranteesGrants.join('\n');
};

export const hideUsers = async (userIds) => {
  const ids = userIds || null;
  const where = ids ? { id: ids } : {};
  // save real users
  realUsers = await User.findAll({
    attributes: ['id', 'email'],
    where,
  }).map((u) => u.dataValues);

  const users = await User.findAll({
    where,
  });
  const promises = [];
  // loop through the found users
  for await (const user of users) {
    promises.push(
      user.update({
        hsesUsername: faker.internet.email(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.phoneNumber(),
        name: faker.name.findName(),
      }),
    );
  }

  await Promise.all(promises);
  // Retrieve transformed users
  transformedUsers = await User.findAll({
    attributes: ['id', 'email'],
  }).map((u) => u.dataValues);
};

export const hideGranteesGrants = async (granteesGrants) => {
  realGrants = await Grant.findAll({
    attributes: ['id', 'granteeId', 'number'],
  }).map((g) => g.dataValues);

  const granteesArray = granteesGrants ? granteesGrants.split('\n').map((el) => el.split('|')[0].trim()) : null;
  const grantsArray = (granteesArray && granteesArray.length > 1) ? granteesGrants.split('\n').map((el) => el.split('|')[1].trim()) : null;
  const granteeWhere = granteesArray ? { name: { [Op.like]: { [Op.any]: granteesArray } } } : {};
  const grantWhere = grantsArray ? { number: { [Op.like]: { [Op.any]: grantsArray } } } : {};
  const grantees = await Grantee.findAll({
    where: granteeWhere,
  });

  const promises = [];

  // loop through the found reports
  for await (const grantee of grantees) {
    promises.push(
      grantee.update({
        name: faker.company.companyName(),
      }),
    );
  }
  const grants = await Grant.findAll({
    where: grantWhere,
  });

  for await (const grant of grants) {
    const trailingNumber = grant.id;
    const newGrantNumber = `0${faker.datatype.number({ min: 1, max: 9 })}${faker.animal.type()}0${trailingNumber}`;

    promises.push(
      grant.update({
        number: newGrantNumber,
      }),
    );
  }
  await Promise.all(promises);

  // Retrieve transformed grantees
  transformedGrantees = await Grantee.findAll({
    attributes: ['id', 'name'],
    where: { id: grantees.map((g) => g.id) },
  }).map((g) => g.dataValues);

  // Retrieve transformed grants
  transformedGrants = await Grant.findAll({
    attributes: ['id', 'number'],
    where: { id: grants.map((g) => g.id) },
  }).map((g) => g.dataValues);
};

const givePermissions = (id) => {
  const permissionsArray = [
    {
      userId: id,
      scopeId: SITE_ACCESS,
      regionId: 14,
    },
    {
      userId: id,
      regionId: 14,
      scopeId: ADMIN,
    },
    {
      userId: id,
      regionId: 1,
      scopeId: READ_WRITE_REPORTS,
    },
    {
      userId: id,
      regionId: 1,
      scopeId: APPROVE_REPORTS,
    },
  ];

  for (let region = 1; region < 13; region++) {
    permissionsArray.push({
      userId: id,
      regionId: region,
      scopeId: READ_REPORTS,
    });
  }

  return permissionsArray;
};
export const bootstrapUsers = async () => {
  const userPromises = [];
  for await (const hsesUser of hsesUsers) {
    const user = await User.findOne({ where: { hsesUserId: hsesUser.hsesUserId } });
    let id;
    const newUser = {
      ...hsesUser,
      homeRegionId: 14,
      role: sequelize.literal(`ARRAY['Central Office']::"enum_Users_role"[]`),
      hsesAuthorities: ['ROLE_FEDERAL'],
    };
    if (user) {
      id = user.id;
      userPromises.push(user.update(newUser));
      for (const permission of givePermissions(id)) {
        userPromises.push(Permission.findOrCreate({ where: permission }));
      }
    } else {
      const createdUser = await User.create(newUser);
      if (createdUser) {
        for (const permission of givePermissions(createdUser.id)) {
          userPromises.push(Permission.findOrCreate({ where: permission }));
        }
      }
    }

    await Promise.all(userPromises);
  }
};

const processData = async (mockReport) => {
  const activityReportId = mockReport ? mockReport.id : null;
  const where = activityReportId ? { id: activityReportId } : {};
  const filesWhere = activityReportId ? { activityReportId } : {};
  const userIds = mockReport ? [3000, 3001, 3002, 3003] : null;

  const granteesGrants = mockReport ? mockReport.imported.granteeName : null;
  const reports = await ActivityReport.unscoped().findAll({
    where,
  });

  const files = await File.findAll({
    where: filesWhere,
  });

  const promises = [];

  // Hide users
  await hideUsers(userIds);
  // Hide grantees and grants
  await hideGranteesGrants(granteesGrants);

  // loop through the found reports
  for await (const report of reports) {
    const { imported } = report;

    promises.push(
      report.update({
        managerNotes: await processHtml(report.managerNotes),
        additionalNotes: await processHtml(report.additionalNotes),
        context: await processHtml(report.context),
      }),
    );
    if (imported) {
      const newImported = {
        additionalNotesForThisActivity: await processHtml(
          imported.additionalNotesForThisActivity,
        ),
        cdiGranteeName: await processHtml(imported.cdiGranteeName),
        contextForThisActivity: await processHtml(
          imported.contextForThisActivity,
        ),
        created: imported.created,
        createdBy: convertEmails(imported.createdBy),
        duration: imported.duration,
        endDate: imported.endDate,
        format: imported.format,
        goal1: imported.goal1,
        goal2: imported.goal2,
        granteeFollowUpTasksObjectives: await processHtml(
          imported.granteeFollowUpTasksObjectives,
        ),
        granteeName: convertGranteeName(imported.granteeName),
        granteeParticipants: imported.granteeParticipants,
        granteesLearningLevelGoal1: imported.granteesLearningLevelGoal1,
        granteesLearningLevelGoal2: imported.granteesLearningLevelGoal2,
        manager: convertEmails(imported.manager),
        modified: imported.modified,
        modifiedBy: convertEmails(imported.modifiedBy),
        multiGranteeActivities: imported.multiGranteeActivities,
        nonGranteeActivity: imported.nonGranteeActivity,
        nonGranteeParticipants: imported.nonGranteeParticipants,
        nonOhsResources: imported.nonOhsResources,
        numerOfParticipants: imported.numberOfParticipants,
        objective11: imported.objective11,
        objective11Status: imported.objective11Status,
        objective12: imported.objective12,
        objective12Status: imported.objective12Status,
        objective21: imported.objective21,
        objective21Status: imported.objective21Status,
        objective22: imported.objective22,
        objective22Status: imported.objective22Status,
        otherSpecialists: convertEmails(imported.otherSpecialists),
        otherTopics: imported.otherTopics,
        programType: imported.programType,
        reasons: imported.reasons,
        reportId: imported.reportId,
        resourcesUsed: imported.resourcesUsed,
        sourceOfRequest: imported.sourceOfRequest,
        specialistFollowUpTasksObjectives: await processHtml(
          imported.specialistFollowUpTasksObjectives,
        ),
        startDate: imported.startDate,
        tTa: imported.tTa,
        targetPopulations: imported.targetPopulations,
        topics: imported.topics,
        ttaProvidedAndGranteeProgressMade: imported.ttaProvidedAndGranteeProgressMade,
      };
      promises.push(report.update({ imported: newImported }));
    }
  }

  for await (const file of files) {
    promises.push(
      file.update({
        originalFileName: convertFileName(file.originalFileName),
      }),
    );
  }

  await bootstrapUsers();

  return Promise.all(promises);
};

export default processData;