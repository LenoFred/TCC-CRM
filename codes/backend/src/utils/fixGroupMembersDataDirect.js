/**
 * DIRECT FIX: Swap MemberID and GroupID columns in GroupMembers sheet
 *
 * Corrupted rows have:  [GroupMemberID, GroupID (GRP-...), MemberID (MEM-...)]
 * Should be:            [GroupMemberID, MemberID (MEM-...), GroupID (GRP-...)]
 *
 * USAGE:
 *   1. Update SHEET_ID and put your creds.json path
 *   2. Run: node fixGroupMembersDataDirect.js
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1XCqJk2XBPcPjXFo1nN-h4tWMLLOrAJnajfT63rQ3iDs';
const CREDS_PATH = path.join(__dirname, '../../credentials.json');

async function fixGroupMembersSwap() {
  try {
    console.log('🔧 GroupMembers Column Swap Fixer\n');
    console.log(`📊 Target Sheet ID: ${SHEET_ID}\n`);

    // Load credentials
    if (!fs.existsSync(CREDS_PATH)) {
      throw new Error(`Credentials file not found: ${CREDS_PATH}`);
    }

    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // STEP 1: Read all GroupMembers data
    console.log('📖 Reading GroupMembers sheet...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'GroupMembers!A1:D'
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      console.log('✅ Sheet is empty or has only headers');
      return;
    }

    // STEP 2: Identify corrupted rows
    const headers = rows[0]; // [GroupMemberID, MemberID, GroupID, Status]
    console.log(`📋 Headers: ${headers.join(' | ')}\n`);

    const corruptedIndices = [];
    const fixedData = [headers]; // Keep header row

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const col2 = String(row[1] || '').trim(); // Current column 2
      const col3 = String(row[2] || '').trim(); // Current column 3

      // Check if columns are swapped
      if (col2.startsWith('GRP-') && col3.startsWith('MEM-')) {
        // SWAP THEM
        corruptedIndices.push(i);
        fixedData.push([
          row[0], // GroupMemberID (unchanged)
          col3,   // MemberID (was in col3, move to col2)
          col2,   // GroupID (was in col2, move to col3)
          row[3]  // Status (unchanged)
        ]);

        console.log(`⚠️  Row ${i + 1}: ${row[0]}`);
        console.log(`    Before: MemberID=${col2}, GroupID=${col3}`);
        console.log(`    After:  MemberID=${col3}, GroupID=${col2}`);
      } else {
        // Keep as is
        fixedData.push(row);
      }
    }

    if (corruptedIndices.length === 0) {
      console.log('\n✅ No corrupted rows found!');
      return { corrupted: 0, fixed: 0 };
    }

    console.log(`\n🔄 Found ${corruptedIndices.length} corrupted rows\n`);

    // STEP 3: Write the corrected data back
    console.log('📝 Writing corrected data back to sheet...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'GroupMembers!A1:D',
      valueInputOption: 'RAW',
      resource: { values: fixedData }
    });

    console.log(`\n✅ Successfully fixed ${corruptedIndices.length} rows!\n`);
    console.log('📊 Summary:');
    console.log(`   - Total rows processed: ${rows.length - 1}`);
    console.log(`   - Corrupted rows fixed: ${corruptedIndices.length}`);
    console.log(`   - Status: COMPLETE ✓`);

    return { corrupted: corruptedIndices.length, fixed: corruptedIndices.length };

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run it
fixGroupMembersSwap().then(() => {
  console.log('\n🎉 Sheet fix completed!');
  process.exit(0);
});
