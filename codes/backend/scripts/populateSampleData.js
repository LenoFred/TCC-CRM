/**
 * Script to populate Google Sheets with sample data for testing
 * Run with: node scripts/populateSampleData.js
 */

import sheetsService from '../src/services/sheetsService.js';
import logger from '../src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample data generators
const generateMemberId = (index) => `MEM${String(index).padStart(4, '0')}`;
const generateFamilyId = (index) => `FAM${String(index).padStart(4, '0')}`;
const generateGroupId = (index) => `GRP${String(index).padStart(3, '0')}`;
const generateEventId = (index) => `EVT${String(index).padStart(4, '0')}`;
const generateDonationId = (index) => `DON${String(index).padStart(5, '0')}`;

const nigerianNames = {
  firstNames: ['Chioma', 'Emeka', 'Ngozi', 'Chukwuemeka', 'Oluwaseun', 'Adebayo', 'Folake', 'Ibrahim', 'Fatima', 'Blessing', 'Samuel', 'Grace', 'David', 'Esther', 'John', 'Mary', 'Paul', 'Ruth', 'Joseph', 'Sarah'],
  lastNames: ['Okonkwo', 'Adeyemi', 'Nwosu', 'Adeleke', 'Bello', 'Eze', 'Okafor', 'Williams', 'Johnson', 'Okoro', 'Abubakar', 'Olayemi', 'Chukwu', 'Oladipo', 'Musa', 'Ibrahim', 'Adebisi', 'Nnamdi', 'Chinedu', 'Oluwatobi']
};

const generatePhoneNumber = () => {
  const prefixes = ['0803', '0806', '0810', '0813', '0815', '0816', '0818', '0905', '0906', '0909'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
};

const generateEmail = (firstName, lastName) => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
};

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const randomPastDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return formatDate(date);
};

// Generate sample members (including guests)
function generateMembers(count = 50) {
  const members = [];
  const now = new Date();
  
  for (let i = 1; i <= count; i++) {
    const firstName = nigerianNames.firstNames[Math.floor(Math.random() * nigerianNames.firstNames.length)];
    const lastName = nigerianNames.lastNames[Math.floor(Math.random() * nigerianNames.lastNames.length)];
    const isGuest = i > 40; // Last 10 are guests
    const joinDate = formatDate(randomDate(new Date(2020, 0, 1), now));
    
    members.push({
      memberId: generateMemberId(i),
      firstName,
      lastName,
      email: generateEmail(firstName, lastName),
      phoneNumber: generatePhoneNumber(),
      dateOfBirth: formatDate(randomDate(new Date(1960, 0, 1), new Date(2010, 0, 1))),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'][Math.floor(Math.random() * 4)],
      memberStatus: isGuest ? 'Guest' : (['Active', 'Active', 'Active', 'Inactive'][Math.floor(Math.random() * 4)]),
      membershipType: isGuest ? 'Guest' : (['Full Member', 'Full Member', 'Associate', 'Youth'][Math.floor(Math.random() * 4)]),
      joinDate,
      address: `${Math.floor(Math.random() * 100)} ${['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba'][Math.floor(Math.random() * 5)]} Street`,
      city: 'Lagos',
      state: 'Lagos',
      familyId: i <= 30 ? generateFamilyId(Math.ceil(i / 3)) : '', // First 30 members belong to families
      branchId: 'BRANCH001',
      serviceAttendance: isGuest ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 50),
      createdAt: joinDate,
      updatedAt: formatDate(now),
      notes: isGuest ? 'Guest visitor - follow up needed' : ''
    });
  }
  
  return members;
}

// Generate sample donations
function generateDonations(memberIds, count = 30) {
  const donations = [];
  const categories = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special Project'];
  const methods = ['Cash', 'Bank Transfer', 'Card', 'Mobile Money'];
  const statuses = ['Verified', 'Verified', 'Verified', 'Pending']; // 75% verified
  
  for (let i = 1; i <= count; i++) {
    const amount = (Math.floor(Math.random() * 50) + 5) * 1000; // 5,000 to 55,000
    const donationDate = randomPastDate(90);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    donations.push({
      donationId: generateDonationId(i),
      memberId: memberIds[Math.floor(Math.random() * memberIds.length)],
      amount,
      currency: 'NGN',
      donationDate,
      category: categories[Math.floor(Math.random() * categories.length)],
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      referenceNumber: `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      verificationStatus: status,
      verifiedBy: status === 'Verified' ? 'STAFF001' : '',
      verifiedAt: status === 'Verified' ? donationDate : '',
      notes: status === 'Pending' ? 'Awaiting verification' : 'Verified and recorded',
      createdAt: donationDate,
      updatedAt: formatDate(new Date())
    });
  }
  
  return donations;
}

// Generate sample attendance records
function generateAttendance(memberIds, count = 100) {
  const attendance = [];
  const services = ['Sunday Service', 'Midweek Service', 'Bible Study', 'Prayer Meeting'];
  
  for (let i = 1; i <= count; i++) {
    const attendanceDate = randomPastDate(60);
    
    attendance.push({
      attendanceId: `ATT${String(i).padStart(5, '0')}`,
      memberId: memberIds[Math.floor(Math.random() * memberIds.length)],
      eventType: 'Service',
      eventId: generateEventId(Math.floor(Math.random() * 20) + 1),
      serviceName: services[Math.floor(Math.random() * services.length)],
      attendanceDate,
      checkInTime: `${Math.floor(Math.random() * 2) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`,
      checkInMethod: ['QR Code', 'Manual', 'Mobile App'][Math.floor(Math.random() * 3)],
      branchId: 'BRANCH001',
      createdAt: attendanceDate
    });
  }
  
  return attendance;
}

// Generate sample families
function generateFamilies(count = 10) {
  const families = [];
  
  for (let i = 1; i <= count; i++) {
    const lastName = nigerianNames.lastNames[Math.floor(Math.random() * nigerianNames.lastNames.length)];
    
    families.push({
      familyId: generateFamilyId(i),
      familyName: `${lastName} Family`,
      headOfFamilyId: generateMemberId(i * 3 - 2), // Link to first member of each family group
      address: `${Math.floor(Math.random() * 100)} ${['Ikeja', 'Lekki', 'Victoria Island'][Math.floor(Math.random() * 3)]} Street`,
      city: 'Lagos',
      state: 'Lagos',
      phoneNumber: generatePhoneNumber(),
      email: `${lastName.toLowerCase()}family@example.com`,
      memberCount: 3,
      createdAt: randomPastDate(365),
      updatedAt: formatDate(new Date())
    });
  }
  
  return families;
}

// Generate sample groups
function generateGroups(count = 5) {
  const groups = [];
  const groupTypes = ['Small Group', 'Ministry', 'Youth Group', 'Prayer Group'];
  const groupNames = ['Men\'s Fellowship', 'Women\'s Ministry', 'Youth Alive', 'Choir', 'Ushering Team'];
  
  for (let i = 1; i <= count; i++) {
    groups.push({
      groupId: generateGroupId(i),
      groupName: groupNames[i - 1] || `Group ${i}`,
      groupType: groupTypes[Math.floor(Math.random() * groupTypes.length)],
      description: `Active ministry group focusing on service and fellowship`,
      leaderId: generateMemberId(Math.floor(Math.random() * 30) + 1),
      meetingDay: ['Monday', 'Wednesday', 'Friday', 'Saturday'][Math.floor(Math.random() * 4)],
      meetingTime: `${Math.floor(Math.random() * 3) + 5}:00 PM`,
      location: ['Main Hall', 'Fellowship Room', 'Youth Center'][Math.floor(Math.random() * 3)],
      isActive: true,
      memberCount: Math.floor(Math.random() * 20) + 5,
      createdAt: randomPastDate(730),
      updatedAt: formatDate(new Date())
    });
  }
  
  return groups;
}

// Main population function
async function populateSampleData() {
  try {
    logger.info('🌱 Starting sample data population...');
    
    // Generate data
    logger.info('📝 Generating sample data...');
    const members = generateMembers(50);
    const memberIds = members.map(m => m.memberId);
    const donations = generateDonations(memberIds, 30);
    const attendance = generateAttendance(memberIds, 100);
    const families = generateFamilies(10);
    const groups = generateGroups(5);
    
    logger.info(`Generated:
      - ${members.length} members (including ${members.filter(m => m.memberStatus === 'Guest').length} guests)
      - ${donations.length} donations (${donations.filter(d => d.verificationStatus === 'Pending').length} pending)
      - ${attendance.length} attendance records
      - ${families.length} families
      - ${groups.length} groups
    `);
    
    // Write to sheets
    logger.info('📤 Writing to Google Sheets...');
    
    // Members sheet
    const memberHeaders = Object.keys(members[0]);
    const memberRows = members.map(m => memberHeaders.map(h => m[h] || ''));
    await sheetsService.updateSheetData('Members', [memberHeaders, ...memberRows]);
    logger.info('✅ Members sheet populated');
    
    // Donations sheet
    const donationHeaders = Object.keys(donations[0]);
    const donationRows = donations.map(d => donationHeaders.map(h => d[h] || ''));
    await sheetsService.updateSheetData('Donations', [donationHeaders, ...donationRows]);
    logger.info('✅ Donations sheet populated');
    
    // Attendance sheet
    const attendanceHeaders = Object.keys(attendance[0]);
    const attendanceRows = attendance.map(a => attendanceHeaders.map(h => a[h] || ''));
    await sheetsService.updateSheetData('Attendance', [attendanceHeaders, ...attendanceRows]);
    logger.info('✅ Attendance sheet populated');
    
    // Families sheet
    const familyHeaders = Object.keys(families[0]);
    const familyRows = families.map(f => familyHeaders.map(h => f[h] || ''));
    await sheetsService.updateSheetData('Families', [familyHeaders, ...familyRows]);
    logger.info('✅ Families sheet populated');
    
    // Groups sheet
    const groupHeaders = Object.keys(groups[0]);
    const groupRows = groups.map(g => groupHeaders.map(h => g[h] || ''));
    await sheetsService.updateSheetData('Groups', [groupHeaders, ...groupRows]);
    logger.info('✅ Groups sheet populated');
    
    logger.info('🎉 Sample data population completed successfully!');
    logger.info(`
      Summary:
      - Total Members: ${members.length}
      - Active Members: ${members.filter(m => m.memberStatus === 'Active').length}
      - Guests: ${members.filter(m => m.memberStatus === 'Guest').length}
      - Total Donations: ${donations.length}
      - Pending Donations: ${donations.filter(d => d.verificationStatus === 'Pending').length}
      - Verified Donations: ${donations.filter(d => d.verificationStatus === 'Verified').length}
      - Total Attendance: ${attendance.length}
      - Families: ${families.length}
      - Groups: ${groups.length}
    `);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error populating sample data:', { error: error.message });
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSampleData();
}

export default populateSampleData;
