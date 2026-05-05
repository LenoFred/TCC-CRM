/**
 * Donations Controller
 * Handles all donation-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { filterByGroupPermissions } = require('../../middlewares/groupPermissions');

class DonationsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.DONATIONS, 'Donations');
  }

  getSearchFields() {
    return ['fund', 'status'];
  }

  getDefaultHeaders() {
    return [
      'DonationID',
      'MemberID',
      'Amount',
      'DonationDate',
      'Fund',
      'PayDate',
      'Status',
      'GroupID',
    ];
  }

  getIdColumn() {
    return 'DonationID';
  }

  async prepareCreateData(data, user) {
    // Validate amount
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new ApiError(400, 'Valid donation amount is required');
    }

    // MemberID can be either a Member ID (MEM-) or Guest ID (GST-)
    // Validate that the ID exists in either Members or Guest sheet
    if (data.memberID) {
      const idPrefix = data.memberID.substring(0, 3);
      
      if (idPrefix === 'MEM') {
        // Check Members sheet
        const members = await sheetsService.getSheetObjects(
          sheetsService.SHEETS.MEMBERS
        );
        const member = members.find((m) => m.memberID === data.memberID);
        if (!member) {
          throw new ApiError(404, 'Member not found');
        }
      } else if (idPrefix === 'GST') {
        // Check Guest sheet
        const guests = await sheetsService.getSheetObjects(
          sheetsService.SHEETS.GUEST
        );
        const guest = guests.find((g) => g.guestID === data.memberID);
        if (!guest) {
          throw new ApiError(404, 'Guest not found');
        }
      } else {
        throw new ApiError(400, 'Invalid MemberID format. Must start with MEM- or GST-');
      }
    } else {
      throw new ApiError(400, 'MemberID is required');
    }

    // Validate GroupID if provided
    if (data.groupID) {
      const { hasAccessToGroup, getStaffGroupPermissions } = require('../../middlewares/groupPermissions');
      if (user && user.req && !hasAccessToGroup(user.req, data.groupID)) {
        // Get user's accessible groups for error context
        const userGroups = getStaffGroupPermissions(user.req);
        let groupsList = 'No groups assigned';
        if (Array.isArray(userGroups) && userGroups.length > 0) {
          try {
            const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
            const groupNames = groups
              .filter(g => userGroups.includes(g.groupID))
              .map(g => g.groupName)
              .join(', ');
            groupsList = groupNames || userGroups.join(', ');
          } catch (error) {
            groupsList = userGroups.join(', ');
          }
        }
        throw new ApiError(403, `You don't have access to this group. Your assigned groups: ${groupsList}`);
      }
    }

    return {
      donationID: generateId('DONATION'),
      memberID: data.memberID,
      amount: amount.toString(),
      donationDate: data.donationDate || new Date().toISOString().split('T')[0],
      fund: data.fund || 'General',
      payDate: data.payDate || '',
      status: data.status || 'Unpaid',
      groupID: data.groupID || '',
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.memberID) {
      filteredData = filteredData.filter(
        (item) => item.memberID === filters.memberID
      );
    }

    if (filters.fund) {
      filteredData = filteredData.filter(
        (item) => item.fund?.toLowerCase() === filters.fund.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Date range filters
    if (filters.startDate) {
      filteredData = filteredData.filter((item) => item.donationDate >= filters.startDate);
    }

    if (filters.endDate) {
      filteredData = filteredData.filter((item) => item.donationDate <= filters.endDate);
    }

    // Amount range filters
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      filteredData = filteredData.filter(
        (item) => parseFloat(item.amount) >= minAmount
      );
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      filteredData = filteredData.filter(
        (item) => parseFloat(item.amount) <= maxAmount
      );
    }

    return filteredData;
  }

  /**
   * Get donor details from Members or Guest sheet
   */
  async getDonorDetails(memberID) {
    if (!memberID) {
      return null;
    }

    const idPrefix = memberID.substring(0, 3);

    try {
      if (idPrefix === 'MEM') {
        // Fetch from Members sheet
        const members = await sheetsService.getSheetObjects(
          sheetsService.SHEETS.MEMBERS
        );
        const member = members.find((m) => m.memberID === memberID);
        
        if (member) {
          return {
            name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
            email: member.email || '',
            phone: member.phoneNumber || '',
            type: 'Member',
          };
        }
      } else if (idPrefix === 'GST') {
        // Fetch from Guest sheet
        const guests = await sheetsService.getSheetObjects(
          sheetsService.SHEETS.GUEST
        );
        const guest = guests.find((g) => g.guestID === memberID);
        
        if (guest) {
          return {
            name: guest.name || 'Unknown Guest',
            email: guest.email || '',
            phone: guest.phone || '',
            type: 'Guest',
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching donor details for ${memberID}:`, error);
    }

    return null;
  }

  /**
   * Override getAll to include donor details and filter by group permissions
   */
  async getAll(req, res) {
    let data = await sheetsService.getSheetObjects(this.sheetName);
    
    // Apply group permissions filtering
    data = filterByGroupPermissions(data, req, 'groupID');
    
    const filtered = this.applyFilters(data, req.query);

    // Add donor details to each donation
    const donationsWithDetails = await Promise.all(
      filtered.map(async (donation) => {
        const donorDetails = await this.getDonorDetails(donation.memberID);
        return {
          ...donation,
          donorDetails,
        };
      })
    );

    res.json(donationsWithDetails);
  }

  /**
   * Get donations by member with group permission filtering
   */
  async getByMember(req, res) {
    const { memberID } = req.params;

    let data = await sheetsService.getSheetObjects(this.sheetName);
    
    // Apply group permissions filtering
    data = filterByGroupPermissions(data, req, 'groupID');
    
    const donations = data.filter((d) => d.memberID === memberID);

    const totalAmount = donations.reduce(
      (sum, d) => sum + parseFloat(d.amount || 0),
      0
    );

    res.json({
      memberID,
      total: donations.length,
      totalAmount,
      donations,
    });
  }

  /**
   * Verify donation - changes status from Unpaid to Paid
   */
  async verify(req, res) {
    const { id } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const donation = data.find((d) => this.matchId(d, id));

    if (!donation) {
      throw new ApiError(404, 'Donation not found');
    }

    if (donation.status?.toLowerCase() === 'paid') {
      throw new ApiError(400, 'Donation already verified');
    }

    const updated = {
      ...donation,
      status: 'Paid',
    };

    await this.updateInSheet(donation, updated, data, req.user);

    res.json({
      message: 'Donation verified successfully',
      data: updated,
    });
  }

  /**
   * Get donation statistics with group permission filtering
   */
  async getStats(req, res) {
    const { startDate, endDate } = req.query;

    let data = await sheetsService.getSheetObjects(this.sheetName);
    
    // Apply group permissions filtering
    data = filterByGroupPermissions(data, req, 'groupID');

    // Apply date filters if provided
    if (startDate) {
      data = data.filter((d) => d.donationDate >= startDate);
    }
    if (endDate) {
      data = data.filter((d) => d.donationDate <= endDate);
    }

    const totalDonations = data.length;
    const paidDonations = data.filter(
      (d) => d.status?.toLowerCase() === 'paid'
    ).length;
    const unpaidDonations = data.filter(
      (d) => d.status?.toLowerCase() === 'unpaid'
    ).length;

    // Calculate total amounts
    const totalAmount = data.reduce(
      (sum, d) => sum + parseFloat(d.amount || 0),
      0
    );
    const paidAmount = data
      .filter((d) => d.status?.toLowerCase() === 'paid')
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    // Fund distribution
    const fundDistribution = {};
    data.forEach((d) => {
      const fund = d.fund || 'Unknown';
      if (!fundDistribution[fund]) {
        fundDistribution[fund] = { count: 0, amount: 0 };
      }
      fundDistribution[fund].count++;
      fundDistribution[fund].amount += parseFloat(d.amount || 0);
    });

    // Top donors
    const donorTotals = {};
    data
      .filter((d) => d.memberID)
      .forEach((d) => {
        donorTotals[d.memberID] =
          (donorTotals[d.memberID] || 0) + parseFloat(d.amount || 0);
      });

    const topDonors = Object.entries(donorTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([memberID, amount]) => ({ memberID, amount }));

    res.json({
      dateRange: { startDate, endDate },
      totalDonations,
      paidDonations,
      unpaidDonations,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      avgDonation:
        totalDonations > 0
          ? Math.round((totalAmount / totalDonations) * 100) / 100
          : 0,
      fundDistribution,
      topDonors,
    });
  }
}

module.exports = new DonationsController();
