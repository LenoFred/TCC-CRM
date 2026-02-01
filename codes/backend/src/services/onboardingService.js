/**
 * Membership Automation Service
 * Handles automation for member Status and membershipLevel based on attendance and onboarding progress
 */

const sheetsService = require('./sheetsService');

const CLASS_TYPE_KEY_MAP = {
  foundational: 'Foundational',
  believers: 'Foundational',
  foundationalbelievers: 'Foundational',
  clds: 'CLDS',
  christianlifedevelopmentschool: 'CLDS',
  gbic: 'GBIC',
  generalbibleinsightcourse: 'GBIC',
  abic: 'ABIC',
  advancedbibleinsightcourse: 'ABIC',
  baptism: 'Baptism',
  baptismal: 'Baptism',
  baptismalclass: 'Baptism',
  sundayservice: 'Other',
  sunday: 'Other',
  service: 'Other',
  other: 'Other',
};

const CLASS_COUNT_KEYS = ['Foundational', 'CLDS', 'GBIC', 'ABIC', 'Baptism', 'Other'];

const REQUIRED_CLASS_COUNTS = {
  Foundational: 1,
  Baptism: 1,
  CLDS: 6,
};

function normalizeValue(value) {
  return (value || '').toString().trim();
}

function resolveValue(record, key) {
  if (!record) return undefined;
  const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
  const lowerKey = key.toLowerCase();
  const upperKey = key.toUpperCase();
  return record[key] ?? record[camelKey] ?? record[lowerKey] ?? record[upperKey];
}

function mapClassTypeKey(rawType) {
  if (!rawType) return null;
  const cleaned = normalizeValue(rawType).toLowerCase().replace(/[^a-z0-9]/g, '');
  return CLASS_TYPE_KEY_MAP[cleaned] || null;
}

/**
 * Get the last N Sundays before a given date (inclusive)
 * @param {Date} refDate - Reference date (default: today)
 * @param {number} n - Number of Sundays
 * @returns {string[]} Array of dates in YYYY-MM-DD format
 */
function getLastNSundays(refDate = new Date(), n = 4) {
  const sundays = [];
  let date = new Date(refDate);
  while (sundays.length < n) {
    if (date.getDay() === 0) {
      sundays.push(date.toISOString().split('T')[0]);
    }
    date.setDate(date.getDate() - 1);
  }
  return sundays;
}

/**
 * Update member Status and membershipLevel based on attendance and onboarding
 * - If member missed 4 consecutive Sundays, set Status to 'Inactive'
 * - If Inactive and attended, set Status to 'Active'
 * - Set membershipLevel to 'registered member' once CLDS and Baptism are complete
 */
async function automateMembershipStatusAndLevel() {
  const [members, attendance, gatherings] = await Promise.all([
    sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS),
    sheetsService.getSheetObjects(sheetsService.SHEETS.ATTENDANCE),
    sheetsService.getSheetObjects(sheetsService.SHEETS.GATHERINGS),
  ]);

  const gatheringLookup = (gatherings || []).reduce((acc, gathering) => {
    const gatheringId = normalizeValue(
      resolveValue(gathering, 'gatheringID') ||
      resolveValue(gathering, 'gatheringId') ||
      resolveValue(gathering, 'id')
    );
    if (gatheringId) {
      acc[gatheringId] = gathering;
    }
    return acc;
  }, {});

  const attendanceByMember = (attendance || []).reduce((acc, record) => {
    const memberKey = normalizeValue(
      resolveValue(record, 'memberID') ||
      resolveValue(record, 'memberId') ||
      resolveValue(record, 'member')
    );
    if (!memberKey) {
      return acc;
    }
    acc[memberKey] = acc[memberKey] || [];
    acc[memberKey].push(record);
    return acc;
  }, {});

  const last4Sundays = getLastNSundays(new Date(), 4);

  for (const member of members) {
    const sheetMemberId = resolveValue(member, 'memberID');
    if (!sheetMemberId) {
      continue;
    }
    const normalizedMemberKey = normalizeValue(sheetMemberId);
    const memberAttendanceRecords = attendanceByMember[normalizedMemberKey] || [];

    const attendedSundays = last4Sundays.filter((sunday) =>
      memberAttendanceRecords.some((att) => {
        const attDate = normalizeValue(resolveValue(att, 'checkInTime'));
        if (!attDate.startsWith(sunday)) return false;
        const gatheringIdForAttendance = normalizeValue(
          resolveValue(att, 'gatheringID') || resolveValue(att, 'gatheringId') || resolveValue(att, 'gathering')
        );
        const gathering = gatheringLookup[gatheringIdForAttendance];
        const classTypeKey = mapClassTypeKey(
          resolveValue(gathering, 'classType') || resolveValue(att, 'classType')
        ) || 'Other';
        return classTypeKey === 'Other';
      })
    );

    const hasValueChanged = (newValue, currentValue) =>
      normalizeValue(newValue).toLowerCase() !== normalizeValue(currentValue).toLowerCase();

    const currentStatus = normalizeValue(
      resolveValue(member, 'status') ||
      resolveValue(member, 'memberStatus') ||
      'Active'
    );
    let newStatus = currentStatus;
    if (attendedSundays.length === 0 && last4Sundays.length === 4) {
      newStatus = 'Inactive';
    } else if (currentStatus.toLowerCase() === 'inactive' && attendedSundays.length > 0) {
      newStatus = 'Active';
    }

    const classCounts = CLASS_COUNT_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    memberAttendanceRecords.forEach((record) => {
      const attendanceStatus = normalizeValue(resolveValue(record, 'status')).toLowerCase();
      if (attendanceStatus && !['present', 'attended', 'checkedin', 'checked-in'].includes(attendanceStatus)) {
        return;
      }

      const gatheringId = normalizeValue(
        resolveValue(record, 'gatheringID') ||
        resolveValue(record, 'gatheringId') ||
        resolveValue(record, 'gathering')
      );
      const gathering = gatheringLookup[gatheringId];
      const rawClassType = resolveValue(gathering, 'classType') || resolveValue(record, 'classType');
      const classTypeKey = mapClassTypeKey(rawClassType) || 'Other';
      if (classCounts[classTypeKey] !== undefined) {
        classCounts[classTypeKey] += 1;
      }
    });

    const foundationalDone = classCounts.Foundational >= (REQUIRED_CLASS_COUNTS.Foundational || 0);
    const cldsCompleted = classCounts.CLDS >= (REQUIRED_CLASS_COUNTS.CLDS || 0);
    const baptismDone = classCounts.Baptism >= (REQUIRED_CLASS_COUNTS.Baptism || 0);
    const gbicCompleted = classCounts.GBIC >= 8;
    const abicCompleted = classCounts.ABIC >= 8;
    const shouldPromoteToRegistered = foundationalDone && cldsCompleted && baptismDone;

    const updates = {
      Foundational: foundationalDone ? 'Completed' : 'Not Completed',
      CLDS: cldsCompleted ? 'Completed' : 'Not Completed',
      Baptism: baptismDone ? 'Completed' : 'Not Completed',
      GBIC: gbicCompleted ? 'Completed' : 'Not Completed',
      ABIC: abicCompleted ? 'Completed' : 'Not Completed',
      status: newStatus,
      memberStatus: newStatus,
    };

    if (shouldPromoteToRegistered) {
      updates.membershipLevel = 'registered member';
    }

    const filteredUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const currentValue = resolveValue(member, key);
      if (hasValueChanged(value, currentValue)) {
        filteredUpdates[key] = value;
      }
    });

    if (Object.keys(filteredUpdates).length > 0) {
      await sheetsService.updateRow(
        sheetsService.SHEETS.MEMBERS,
        'MemberID',
        sheetMemberId,
        filteredUpdates
      );
    }
  }
}

module.exports = {
  automateMembershipStatusAndLevel,
  getLastNSundays,
};