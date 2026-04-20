/**
 * Fix GroupMembers Sheet Column Swap Bug
 *
 * ISSUE: Some rows have MemberID and GroupID columns swapped.
 * Correct structure: [GroupMemberID, MemberID, GroupID, Status]
 * Corrupted structure: [GroupMemberID, GroupID, MemberID, Status]
 *
 * This script identifies and fixes affected rows.
 * Run with: node fixGroupMembersColumns.js
 */

const sheetsService = require('../services/sheetsService');
const { google } = require('googleapis');

async function fixGroupMembersColumns() {
  try {
    console.log('🔧 Starting GroupMembers column swap fix...\n');

    // Get all GroupMembers data
    const groupMembersData = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUP_MEMBERS);
    console.log(`📊 Total records: ${groupMembersData.length}`);

    // Identify corrupted rows (where MemberID looks like a GroupID)
    const corruptedRows = [];
    const fixedRows = [];

    groupMembersData.forEach((row, index) => {
      const memberID = String(row.memberID || '').trim();
      const groupID = String(row.groupID || '').trim();

      // Corrupted if: memberID starts with "GRP-" (should be "MEM-")
      if (memberID.startsWith('GRP-') && groupID.startsWith('MEM-')) {
        corruptedRows.push({
          index,
          groupMemberID: row.groupMemberID,
          currentMemberID: memberID,
          currentGroupID: groupID,
          correctedMemberID: groupID,  // Will be swapped
          correctedGroupID: memberID    // Will be swapped
        });
      }
    });

    if (corruptedRows.length === 0) {
      console.log('✅ No corrupted rows found. Sheet is clean!');
      return { success: true, corruptedCount: 0 };
    }

    console.log(`\n⚠️  Found ${corruptedRows.length} corrupted rows that need fixing:`);
    console.log('═'.repeat(80));

    // Show corrupted rows
    corruptedRows.forEach((row, i) => {
      console.log(`\n${i + 1}. GroupMemberID: ${row.groupMemberID}`);
      console.log(`   Current (WRONG):  MemberID=${row.currentMemberID}, GroupID=${row.currentGroupID}`);
      console.log(`   Corrected (FIX):  MemberID=${row.correctedMemberID}, GroupID=${row.correctedGroupID}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\n🔄 Preparing to fix ${corruptedRows.length} rows...`);

    // Build update rows using sheetsService.updateRows
    const updateRows = corruptedRows.map(row => ({
      id: row.groupMemberID,                          // Use GroupMemberID as identifier
      updates: {
        memberID: row.correctedMemberID,
        groupID: row.correctedGroupID
      }
    }));

    // Update each row
    for (const update of updateRows) {
      try {
        // Use sheetsService to build the update
        const rowData = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUP_MEMBERS);
        const rowIndex = rowData.findIndex(r => r.groupMemberID === update.id);

        if (rowIndex !== -1) {
          // Swap the values
          const updatedRow = {
            ...rowData[rowIndex],
            memberID: update.updates.memberID,
            groupID: update.updates.groupID
          };

          // Convert to sheet row format
          const sheetRow = [
            updatedRow.groupMemberID,
            updatedRow.memberID,
            updatedRow.groupID,
            updatedRow.status
          ];

          // Update in sheets via API
          await sheetsService.sheets.spreadsheets.values.update({
            spreadsheetId: sheetsService.sheetId,
            range: `GroupMembers!A${rowIndex + 2}:D${rowIndex + 2}`,  // +2 because row 1 is header
            valueInputOption: 'RAW',
            resource: { values: [sheetRow] }
          });

          fixedRows.push(update.id);
        }
      } catch (error) {
        console.error(`❌ Failed to fix row ${update.id}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully fixed ${fixedRows.length} rows`);

    if (fixedRows.length === corruptedRows.length) {
      console.log('🎉 All corrupted rows have been fixed!');
      return { success: true, corruptedCount: corruptedRows.length, fixedCount: fixedRows.length };
    } else {
      console.log(`⚠️  Only fixed ${fixedRows.length} of ${corruptedRows.length} rows`);
      return { success: false, corruptedCount: corruptedRows.length, fixedCount: fixedRows.length };
    }

  } catch (error) {
    console.error('❌ Error fixing GroupMembers columns:', error);
    return { success: false, error: error.message };
  }
}

// Run the fix
fixGroupMembersColumns().then(result => {
  console.log('\n' + '═'.repeat(80));
  console.log('Summary:', result);
  process.exit(result.success ? 0 : 1);
});
