module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
    async (transaction) => {
      try {
        const loggedUser = '0';
        // const transactionId = '';
        const sessionSig = __filename;
        const auditDescriptor = 'RUN MIGRATIONS';
        await queryInterface.sequelize.query(
          `SELECT
            set_config('audit.loggedUser', '${loggedUser}', TRUE) as "loggedUser",
            set_config('audit.transactionId', NULL, TRUE) as "transactionId",
            set_config('audit.sessionSig', '${sessionSig}', TRUE) as "sessionSig",
            set_config('audit.auditDescriptor', '${auditDescriptor}', TRUE) as "auditDescriptor";`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Add GoalTemplates table
      await queryInterface.createTable('GoalTemplates', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        templateName: {
          allowNull: false,
          type: Sequelize.TEXT,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        // To support up/down on the migration
        sourceGoal: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
      }, { transaction });

      // Add ObjectiveTemplates table
      await queryInterface.createTable('ObjectiveTemplates', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        templateTitle: {
          allowNull: false,
          type: Sequelize.TEXT,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        // To support up/down on the migration
        sourceObjective: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
      }, { transaction });

      // Add GoalTemplateObjectiveTemplates table
      await queryInterface.createTable('GoalTemplateObjectiveTemplates', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        goalTemplateId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'GoalTemplates',
            },
            key: 'id',
          },
        },
        objectiveTemplateId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'ObjectiveTemplates',
            },
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      }, { transaction });

      // Move Topics from goals to objectives
      try {
        await queryInterface.sequelize.query(
          `INSERT INTO "ObjectiveTopics" ("objectiveId", "topicId", "createdAt", "updatedAt")
          SELECT
            o.id "objectiveId",
            tg."topicId",
            tg."createdAt",
            tg."updatedAt"
          FROM "Objectives" o
          JOIN "TopicGoals" tg
          on o."goalId" = tg."goalId"
          LEFT JOIN "ObjectiveTopics" ot
          ON o.id = ot."objectiveId"
          WHERE ot.id is null;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Drop TopicGoals table
      try {
        await queryInterface.dropTable('TopicGoals', { transaction });
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Disable logging while doing mass updates
      try {
        await queryInterface.sequelize.query(
          `
          SELECT "ZAFSetTriggerState"(null, null, null, 'DISABLE');
          `,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Populate GoalTemplates from existing Goals
      try {
        await queryInterface.sequelize.query(
          `INSERT INTO "GoalTemplates" ("templateName", "createdAt", "updatedAt", "sourceGoal")
          SELECT name, NOW(), NOW(), id
          FROM "Goals";`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Populate ObjectiveTemplates from existing Objectives linking to GoalTemplates
      try {
        await queryInterface.sequelize.query(
          `INSERT INTO "ObjectiveTemplates" ("templateTitle", "createdAt", "updatedAt", "sourceObjective")
          SELECT o.title, NOW(), NOW(), o.id
          FROM "Objectives" o;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Add the foreign key relation from Goals table to GoalTemplates for recording the parent
      // template leave goalTemplateId nullable for now until it can be populated with the IDs of
      // the parent templates
      try {
        await queryInterface.addColumn('Goals', 'goalTemplateId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: {
              tableName: 'GoalTemplates',
            },
            key: 'id',
          },
          onUpdate: 'CASCADE',
        }, { transaction });

        await queryInterface.addColumn('Goals', 'grantId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: {
              tableName: 'Grants',
            },
            key: 'id',
          },
          onUpdate: 'CASCADE',
        }, { transaction });
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Add the foreign key relation from Objectives table to ObjectiveTemplates for recording the
      // parent template leave goalTemplateId nullable for now until it can be populated with the
      // IDs of the parent templates
      try {
        await queryInterface.addColumn('Objectives', 'objectiveTemplateId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: {
              tableName: 'ObjectiveTemplates',
            },
            key: 'id',
          },
          onUpdate: 'CASCADE',
        }, { transaction });
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // populate Goals, TopicGoals, Objectives, ObjectiveTopics, & ObjectiveResources
      try {
        await queryInterface.sequelize.query(
          `DO $$
          BEGIN
            CREATE TEMP TABLE "TempGoals"
            (
                "id" serial,
                "grantId" integer,
                "name" text COLLATE pg_catalog."default",
                "status" character varying(255) COLLATE pg_catalog."default",
                "timeframe" text COLLATE pg_catalog."default",
                "isFromSmartsheetTtaPlan" boolean,
                "createdAt" timestamp with time zone NOT NULL,
                "updatedAt" timestamp with time zone NOT NULL,
                "closeSuspendReason" "enum_Goals_closeSuspendReason",
                "closeSuspendContext" text COLLATE pg_catalog."default",
                "goalTemplateId" integer
            );

            CREATE TEMP TABLE "TempObjectives"
            (
                "id" serial,
                "goalId" integer,
                "title" text COLLATE pg_catalog."default",
                "ttaProvided" text COLLATE pg_catalog."default",
                "status" character varying(255) COLLATE pg_catalog."default",
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "objectiveTemplateId" integer
            );

            CREATE TEMP TABLE "TempObjectiveTopics"
            (
                "id" serial,
                "objectiveId" integer NOT NULL,
                "topicId" integer NOT NULL,
                "createdAt" timestamp with time zone NOT NULL,
                "updatedAt" timestamp with time zone NOT NULL
            );

            CREATE TEMP TABLE "TempObjectiveResources"
            (
                "id" serial,
                "userProvidedUrl" character varying(255) COLLATE pg_catalog."default" NOT NULL,
                "objectiveId" integer NOT NULL,
                "createdAt" timestamp with time zone NOT NULL,
                "updatedAt" timestamp with time zone NOT NULL
            );

            CREATE TEMP TABLE "TempActivityReportObjectives"
            (
                id serial,
                "activityReportId" integer NOT NULL,
                "objectiveId" integer NOT NULL,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
            );

            INSERT INTO "TempGoals" (
              "grantId",
              "name",
              "status",
              "timeframe",
              "isFromSmartsheetTtaPlan",
              "createdAt",
              "updatedAt",
              "closeSuspendReason",
              "closeSuspendContext",
              "goalTemplateId"
            )
            select
              "gg"."grantId",
              "g"."name",
              "g"."status",
              "g"."timeframe",
              "g"."isFromSmartsheetTtaPlan",
              "g"."createdAt",
              "g"."updatedAt",
              "g"."closeSuspendReason",
              "g"."closeSuspendContext",
              "gt"."id" "goalTemplateId"
            From "GrantGoals" "gg"
            JOIN "Goals" "g"
            ON "gg"."goalId" = "g"."id"
            JOIN "GoalTemplates" "gt"
            ON "g"."id" = "gt"."sourceGoal";

            INSERT INTO "TempObjectives" (
              "goalId",
              "title",
              "ttaProvided",
              "status",
              "createdAt",
              "updatedAt",
              "objectiveTemplateId"
            )
            select
              "g"."id" "goalId",
              "o"."title",
              "o"."ttaProvided",
              "o"."status",
              "o"."createdAt",
              "o"."updatedAt",
              "ot"."id" "objectiveTemplateId"
            FROM "Objectives" "o"
            JOIN "ObjectiveTemplates" "ot"
            ON "o"."id" = "ot"."sourceObjective"
            LEFT JOIN "GoalTemplates" "gt"
            ON "gt"."sourceGoal" = "o"."goalId"
            LEFT JOIN "TempGoals" "g"
            ON "gt"."id" = "g"."goalTemplateId";

            INSERT INTO "TempObjectiveTopics" (
              "objectiveId",
              "topicId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "o"."id" "objectiveId",
              "oto"."topicId",
              "oto"."createdAt",
              "oto"."updatedAt"
            FROM "ObjectiveTopics" "oto"
            JOIN "ObjectiveTemplates" "ote"
            ON "oto"."objectiveId" = "ote"."sourceObjective"
            JOIN "TempObjectives" "o"
            ON "ote"."id" = "o"."objectiveTemplateId";

            INSERT INTO "TempObjectiveResources" (
              "userProvidedUrl",
              "objectiveId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "ore"."userProvidedUrl",
              "o"."id" "objectiveId",
              "ore"."createdAt",
              "ore"."updatedAt"
            FROM "ObjectiveResources" "ore"
            JOIN "ObjectiveTemplates" "ote"
            ON "ore"."objectiveId" = "ote"."sourceObjective"
            JOIN "TempObjectives" "o"
            ON "ote"."id" = "o"."objectiveTemplateId";

            INSERT INTO "TempActivityReportObjectives" (
              "activityReportId",
              "objectiveId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "aro"."activityReportId",
              o."id" "objectiveId",
              "aro"."createdAt",
              "aro"."updatedAt"
            FROM "ActivityReportObjectives" aro
            JOIN "ObjectiveTemplates" ot
            ON aro."objectiveId" = ot."sourceObjective"
            JOIN "TempObjectives" o
            ON ot.id = o."objectiveTemplateId";

            TRUNCATE TABLE
              "ActivityReportObjectives",
              "ObjectiveResources",
              "ObjectiveTopics",
              "Objectives",
              "Goals",
              "GrantGoals"
            RESTART IDENTITY;

            INSERT INTO "Goals" (
              "id",
              "grantId",
              "name",
              "status",
              "timeframe",
              "isFromSmartsheetTtaPlan",
              "createdAt",
              "updatedAt",
              "closeSuspendReason",
              "closeSuspendContext",
              "goalTemplateId"
            )
            SELECT
              "id",
              "grantId",
              "name",
              "status",
              "timeframe",
              "isFromSmartsheetTtaPlan",
              "createdAt",
              "updatedAt",
              "closeSuspendReason",
              "closeSuspendContext",
              "goalTemplateId"
            FROM "TempGoals";

            INSERT INTO "Objectives"(
              "id",
              "goalId",
              "title",
              "ttaProvided",
              "status",
              "createdAt",
              "updatedAt",
              "objectiveTemplateId"
            )
            SELECT
              "id",
              "goalId",
              "title",
              "ttaProvided",
              "status",
              "createdAt",
              "updatedAt",
              "objectiveTemplateId"
            FROM "TempObjectives";

            INSERT INTO "ObjectiveTopics" (
              "id",
              "objectiveId",
              "topicId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "id",
              "objectiveId",
              "topicId",
              "createdAt",
              "updatedAt"
            FROM "TempObjectiveTopics";

            INSERT INTO "ObjectiveResources" (
              "id",
              "userProvidedUrl",
              "objectiveId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "id",
              "userProvidedUrl",
              "objectiveId",
              "createdAt",
              "updatedAt"
            FROM "TempObjectiveResources";

            INSERT INTO "ActivityReportObjectives"(
              "id",
              "activityReportId",
              "objectiveId",
              "createdAt",
              "updatedAt"
            )
            SELECT
              "id",
              "activityReportId",
              "objectiveId",
              "createdAt",
              "updatedAt"
            FROM "TempActivityReportObjectives";

            DROP TABLE
              "TempGoals",
              "TempObjectives",
              "TempObjectiveTopics",
              "TempObjectiveResources",
              "TempActivityReportObjectives";
          END$$;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Remove unneeded source columns
      try {
        await queryInterface.sequelize.query(
          `DO $$
          BEGIN
            ALTER TABLE "GoalTemplates"
            DROP COLUMN "sourceGoal";

            ALTER TABLE "ObjectiveTemplates"
            DROP COLUMN "sourceObjective";
          END$$;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Remove duplicate templates and realign references duplicates to first instance
      try {
        await queryInterface.sequelize.query(
          `DO $$
          BEGIN
            CREATE TEMP TABLE "TempObjectiveTemplatesReductionMap" AS
            SELECT
              otA.id "primaryTemplateId",
              otB.id "secondaryTemplateId"
            FROM "ObjectiveTemplates" otA
            JOIN "ObjectiveTemplates" otB
            ON otA.id < otB.id
            AND otA."templateTitle" = otB."templateTitle";

            UPDATE ONLY "Objectives"
            SET "objectiveTemplateId" = otrm."primaryTemplateId"
            FROM "TempObjectiveTemplatesReductionMap" otrm
            WHERE "objectiveTemplateId" = otrm."secondaryTemplateId";

            DELETE FROM "ObjectiveTemplates" ot
            USING  "TempObjectiveTemplatesReductionMap" otrm
            WHERE ot.id = otrm."secondaryTemplateId";

            CREATE TEMP TABLE "TempGoalTemplatesReductionMap" AS
            SELECT
              gtA.id "primaryTemplateId",
              gtB.id "secondaryTemplateId"
            FROM "GoalTemplates" gtA
            JOIN "GoalTemplates" gtB
            ON gtA.id < gtB.id
            AND gtA."templateName" = gtB."templateName";

            UPDATE ONLY "Goals"
            SET "goalTemplateId" = gtrm."primaryTemplateId"
            FROM "TempGoalTemplatesReductionMap" gtrm
            WHERE "goalTemplateId" = gtrm."secondaryTemplateId";

            DELETE FROM "GoalTemplates" gt
            USING  "TempGoalTemplatesReductionMap" gtrm
            WHERE gt.id = gtrm."secondaryTemplateId";

            DROP TABLE
              "TempObjectiveTemplatesReductionMap",
              "TempGoalTemplatesReductionMap";
          END$$;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Populate GoalTemplateObjectiveTemplates linking  ObjectiveTemplates to GoalTemplates
      try {
        await queryInterface.sequelize.query(
          `INSERT INTO "GoalTemplateObjectiveTemplates" ("objectiveTemplateId", "goalTemplateId")
          SELECT DISTINCT o."objectiveTemplateId", g."goalTemplateId"
          FROM "Objectives" o
          JOIN "Goals" g
          ON o."goalId" = g."id";`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Make goalTemplateId & grantId required
      await queryInterface.changeColumn(
        'Goals',
        'goalTemplateId',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Goals',
        'grantId',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction },
      );

      // Make objectiveTemplateId required
      await queryInterface.changeColumn(
        'Objectives',
        'objectiveTemplateId',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction },
      );

      // Enable logging while doing structural updates
      try {
        await queryInterface.sequelize.query(
          `
          SELECT "ZAFSetTriggerState"(null, null, null, 'ENABLE');
          `,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      await queryInterface.createTable('ActivityReportFiles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        activityReportId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'ActivityReports',
            },
            key: 'id',
          },
        },
        fileId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'Files',
            },
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      }, { transaction });

      await queryInterface.createTable('ActivityReportObjectiveFiles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        activityReporObjectivetId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'ActivityReportObjectives',
            },
            key: 'id',
          },
        },
        fileId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'Files',
            },
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      }, { transaction });

      await queryInterface.createTable('ObjectiveFiles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        objectivetId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'Objectives',
            },
            key: 'id',
          },
        },
        fileId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'Files',
            },
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      }, { transaction });

      await queryInterface.createTable('ObjectiveTemplateFiles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        objectivetTemplateId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'ObjectiveTemplates',
            },
            key: 'id',
          },
        },
        fileId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: {
              tableName: 'Files',
            },
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      }, { transaction });

      // Disable logging while doing mass updates
      try {
        await queryInterface.sequelize.query(
          `
          SELECT "ZAFSetTriggerState"(null, null, null, 'DISABLE');
          `,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Realign files to use ActivityReportFiles table
      try {
        await queryInterface.sequelize.query(
          `DO $$
          BEGIN
            INSERT INTO "ActivityReportFiles" ("activityReportId", "fileId", "createdAt", "updatedAt")
            SELECT "activityReportId", id, "createdAt", "updatedAt"
            FROM "Files";

            ALTER TABLE "Files"
            DROP COLUMN "activityReportId";
          END$$;`,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }

      // Enable logging while doing structural updates
      try {
        await queryInterface.sequelize.query(
          `
          SELECT "ZAFSetTriggerState"(null, null, null, 'ENABLE');
          `,
          { transaction },
        );
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        throw (err);
      }
    },
  ),
  down: async (queryInterface) => queryInterface.sequelize.transaction(
    async (transaction) => {
      await queryInterface.dropTable('GoalTemplates', { transaction });
      await queryInterface.dropTable('ObjectiveTemplates', { transaction });
    },
  ),
};
