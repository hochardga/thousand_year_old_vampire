#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const CURRENT_VERSION = "1.0";
const PLAID_VERSION = "1.0";
const VALID_PLATFORMS = new Set(["web", "mobile", "desktop", "cross-platform"]);
const VALID_REVENUE_MODELS = new Set([
  "subscription",
  "freemium",
  "one-time",
  "marketplace",
  "ad-supported",
  "free",
]);
const VALID_CODING_AGENTS = new Set([
  "claude-code",
  "cursor",
  "windsurf",
  "copilot",
  "other",
]);
const migrations = {};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  );
}

function validateRequiredString(errors, value, fieldPath) {
  if (!isNonEmptyString(value)) {
    errors.push(`${fieldPath} is required and must be a non-empty string.`);
  }
}

function validateStringArray(errors, value, fieldPath) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${fieldPath} must be a non-empty array.`);
    return;
  }

  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${fieldPath}[${index}] must be a non-empty string.`);
    }
  });
}

function validateChoiceObject(errors, value, fieldPath, { allowEmpty = false } = {}) {
  if (!isPlainObject(value)) {
    errors.push(`${fieldPath} must be an object.`);
    return;
  }

  if (allowEmpty) {
    if (typeof value.choice !== "string") {
      errors.push(`${fieldPath}.choice must be a string.`);
    }
    if (typeof value.rationale !== "string") {
      errors.push(`${fieldPath}.rationale must be a string.`);
    }
    return;
  }

  validateRequiredString(errors, value.choice, `${fieldPath}.choice`);
  validateRequiredString(errors, value.rationale, `${fieldPath}.rationale`);
}

function validateMeta(errors, meta) {
  if (!isPlainObject(meta)) {
    errors.push("meta must be an object.");
    return;
  }

  if (!isIsoTimestamp(meta.createdAt)) {
    errors.push("meta.createdAt must be an ISO 8601 timestamp.");
  }
  if (!isIsoTimestamp(meta.updatedAt)) {
    errors.push("meta.updatedAt must be an ISO 8601 timestamp.");
  }
  if (meta.version !== CURRENT_VERSION) {
    errors.push(
      `meta.version must be "${CURRENT_VERSION}". Run \`node scripts/validate-vision.js --migrate\` for older files.`,
    );
  }
  if (meta.plaidVersion !== PLAID_VERSION) {
    errors.push(`meta.plaidVersion must be "${PLAID_VERSION}".`);
  }
}

function validate(vision) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(vision)) {
    return {
      errors: ["vision.json must contain a top-level object."],
      warnings,
    };
  }

  validateMeta(errors, vision.meta);

  if (!isPlainObject(vision.creator)) {
    errors.push("creator must be an object.");
  } else {
    validateRequiredString(errors, vision.creator.name, "creator.name");
    validateRequiredString(errors, vision.creator.expertise, "creator.expertise");
    validateRequiredString(errors, vision.creator.background, "creator.background");
  }

  if (!isPlainObject(vision.purpose)) {
    errors.push("purpose must be an object.");
  } else {
    validateRequiredString(errors, vision.purpose.whoYouHelp, "purpose.whoYouHelp");
    validateRequiredString(
      errors,
      vision.purpose.problemYouSolve,
      "purpose.problemYouSolve",
    );
    validateRequiredString(
      errors,
      vision.purpose.desiredTransformation,
      "purpose.desiredTransformation",
    );
    validateRequiredString(errors, vision.purpose.whyYou, "purpose.whyYou");
  }

  if (!isPlainObject(vision.product)) {
    errors.push("product must be an object.");
  } else {
    validateRequiredString(errors, vision.product.name, "product.name");
    validateRequiredString(errors, vision.product.oneLiner, "product.oneLiner");
    validateRequiredString(errors, vision.product.howItWorks, "product.howItWorks");
    validateStringArray(errors, vision.product.keyCapabilities, "product.keyCapabilities");
    if (!VALID_PLATFORMS.has(vision.product.platform)) {
      errors.push(
        'product.platform must be one of "web", "mobile", "desktop", or "cross-platform".',
      );
    }
    validateRequiredString(
      errors,
      vision.product.marketDifferentiation,
      "product.marketDifferentiation",
    );
    validateRequiredString(errors, vision.product.magicMoment, "product.magicMoment");
  }

  if (!isPlainObject(vision.audience)) {
    errors.push("audience must be an object.");
  } else {
    validateRequiredString(errors, vision.audience.primaryUser, "audience.primaryUser");
    validateStringArray(errors, vision.audience.secondaryUsers, "audience.secondaryUsers");
    validateRequiredString(
      errors,
      vision.audience.currentAlternatives,
      "audience.currentAlternatives",
    );
    validateRequiredString(errors, vision.audience.frustrations, "audience.frustrations");
  }

  if (!isPlainObject(vision.business)) {
    errors.push("business must be an object.");
  } else {
    if (!VALID_REVENUE_MODELS.has(vision.business.revenueModel)) {
      errors.push(
        'business.revenueModel must be one of "subscription", "freemium", "one-time", "marketplace", "ad-supported", or "free".',
      );
    }
    validateRequiredString(errors, vision.business.initialGoal, "business.initialGoal");
    validateRequiredString(
      errors,
      vision.business.sixMonthVision,
      "business.sixMonthVision",
    );
    validateRequiredString(errors, vision.business.constraints, "business.constraints");
    validateRequiredString(errors, vision.business.goToMarket, "business.goToMarket");
  }

  if (!isPlainObject(vision.feeling)) {
    errors.push("feeling must be an object.");
  } else {
    validateRequiredString(
      errors,
      vision.feeling.brandPersonality,
      "feeling.brandPersonality",
    );
    validateRequiredString(errors, vision.feeling.visualMood, "feeling.visualMood");
    validateRequiredString(errors, vision.feeling.toneOfVoice, "feeling.toneOfVoice");
    validateRequiredString(errors, vision.feeling.antiPatterns, "feeling.antiPatterns");
  }

  if (!isPlainObject(vision.techStack)) {
    errors.push("techStack must be an object.");
  } else {
    if (!VALID_PLATFORMS.has(vision.techStack.appType)) {
      errors.push(
        'techStack.appType must be one of "web", "mobile", "desktop", or "cross-platform".',
      );
    }
    validateChoiceObject(errors, vision.techStack.frontend, "techStack.frontend");
    validateChoiceObject(errors, vision.techStack.backend, "techStack.backend");
    validateChoiceObject(errors, vision.techStack.database, "techStack.database");
    validateChoiceObject(errors, vision.techStack.auth, "techStack.auth");
    validateChoiceObject(errors, vision.techStack.payments, "techStack.payments", {
      allowEmpty: vision.business?.revenueModel === "free",
    });

    if (
      vision.business?.revenueModel === "free" &&
      (vision.techStack.payments?.choice !== "" ||
        vision.techStack.payments?.rationale !== "")
    ) {
      errors.push(
        'techStack.payments.choice and techStack.payments.rationale must be empty strings when business.revenueModel is "free".',
      );
    }

    if (
      vision.business?.revenueModel !== "free" &&
      (!isNonEmptyString(vision.techStack.payments?.choice) ||
        !isNonEmptyString(vision.techStack.payments?.rationale))
    ) {
      errors.push(
        'techStack.payments must include non-empty choice and rationale when business.revenueModel is not "free".',
      );
    }
  }

  if (!isPlainObject(vision.tooling)) {
    errors.push("tooling must be an object.");
  } else {
    if (!VALID_CODING_AGENTS.has(vision.tooling.codingAgent)) {
      errors.push(
        'tooling.codingAgent must be one of "claude-code", "cursor", "windsurf", "copilot", or "other".',
      );
    }

    if (vision.tooling.codingAgent === "other") {
      validateRequiredString(
        errors,
        vision.tooling.codingAgentName,
        "tooling.codingAgentName",
      );
    } else if (vision.tooling.codingAgentName) {
      warnings.push(
        "tooling.codingAgentName will be ignored because tooling.codingAgent is not \"other\".",
      );
    }
  }

  if (
    isPlainObject(vision.product) &&
    isPlainObject(vision.techStack) &&
    vision.product.platform !== vision.techStack.appType
  ) {
    warnings.push(
      "product.platform and techStack.appType differ. This is allowed, but double-check that they intentionally describe different scopes.",
    );
  }

  return { errors, warnings };
}

function migrateVision(vision) {
  if (!isPlainObject(vision) || !isPlainObject(vision.meta)) {
    throw new Error("Cannot migrate an invalid vision.json structure.");
  }

  let migrated = JSON.parse(JSON.stringify(vision));

  while (migrated.meta.version !== CURRENT_VERSION) {
    const migration = migrations[migrated.meta.version];
    if (!migration) {
      throw new Error(
        `No migration is available from schema version ${migrated.meta.version} to ${CURRENT_VERSION}.`,
      );
    }

    migrated = migration(migrated);
  }

  return migrated;
}

function readVisionFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeVisionFile(filePath, vision) {
  fs.writeFileSync(filePath, `${JSON.stringify(vision, null, 2)}\n`);
}

function main() {
  const shouldMigrate = process.argv.includes("--migrate");
  const filePath = path.resolve(process.cwd(), "vision.json");

  if (!fs.existsSync(filePath)) {
    console.error("vision.json not found in the current working directory.");
    process.exit(1);
  }

  let vision;
  try {
    vision = readVisionFile(filePath);
  } catch (error) {
    console.error(`Failed to read vision.json: ${error.message}`);
    process.exit(1);
  }

  if (shouldMigrate) {
    try {
      const originalVersion = vision.meta?.version;
      const migrated = migrateVision(vision);
      if (JSON.stringify(migrated) !== JSON.stringify(vision)) {
        writeVisionFile(filePath, migrated);
        vision = migrated;
        console.log(
          `Migrated vision.json from schema ${originalVersion} to ${CURRENT_VERSION}.`,
        );
      }
    } catch (error) {
      console.error(`Migration failed: ${error.message}`);
      process.exit(1);
    }
  }

  const result = validate(vision);

  if (result.warnings.length > 0) {
    console.warn("Vision validation warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`- ${warning}`);
    });
  }

  if (result.errors.length > 0) {
    console.error("Vision validation failed:");
    result.errors.forEach((error) => {
      console.error(`- ${error}`);
    });
    process.exit(1);
  }

  console.log("Vision validation passed.");
}

if (require.main === module) {
  main();
}

module.exports = {
  CURRENT_VERSION,
  PLAID_VERSION,
  migrateVision,
  validate,
};
