/**
 * Donations Controller
 * Handles all donation-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class DonationsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.DONATIONS, 'Donations');
  }

  getSearchFields() {
    return ['donationType', 'paymentMethod', 'category', 'status'];
  }

  getDefaultHeaders() {
    return [
      'DonationID',
      'MemberID',
      'Amount',
      'Currency',
      'DonationType',
      'Category',
      'PaymentMethod',
      'TransactionReference',
      'Date',
      'Status',
      'VerifiedBy',
      'Notes',
      'CreatedAt',
      'UpdatedAt',
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

    // If memberID is provided, validate member exists
    if (data.memberID) {
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const member = members.find((m) => m.memberID === data.memberID);
      if (!member) {
        throw new ApiError(404, 'Member not found');
      }
    }

    return {
      donationID: generateId('DON'),
      memberID: data.memberID || 'Anonymous',
      amount: amount.toString(),
      currency: data.currency || 'NGN',
      donationType: data.donationType || 'General',
      category: data.category || 'Offering',
      paymentMethod: data.paymentMethod || 'Cash',
      transactionReference: data.transactionReference || '',
      date: data.date || new Date().toISOString().split('T')[0],
      status: data.status || 'Pending',
      verifiedBy: data.verifiedBy || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.memberID) {
      filteredData = filteredData.filter(
        (item) => item.memberID === filters.memberID
      );
    }

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.donationType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.category) {
      filteredData = filteredData.filter(
        (item) => item.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.paymentMethod) {
      filteredData = filteredData.filter(
        (item) =>
          item.paymentMethod?.toLowerCase() === filters.paymentMethod.toLowerCase()
      );
    }

    // Date range filters
    if (filters.startDate) {
      filteredData = filteredData.filter((item) => item.date >= filters.startDate);
    }

    if (filters.endDate) {
      filteredData = filteredData.filter((item) => item.date <= filters.endDate);
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
   * Get donations by member
   */
  async getByMember(req, res) {
    const { memberID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
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
   * Verify donation
   */
  async verify(req, res) {
    const { id } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const donation = data.find((d) => this.matchId(d, id));

    if (!donation) {
      throw new ApiError(404, 'Donation not found');
    }

    if (donation.status?.toLowerCase() === 'verified') {
      throw new ApiError(400, 'Donation already verified');
    }

    const updated = {
      ...donation,
      status: 'Verified',
      verifiedBy: req.user?.memberID || '',
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(donation, updated, data, req.user);

    res.json({
      message: 'Donation verified successfully',
      data: updated,
    });
  }

  /**
   * Get donation statistics
   */
  async getStats(req, res) {
    const { startDate, endDate } = req.query;

    let data = await sheetsService.getSheetObjects(this.sheetName);

    // Apply date filters if provided
    if (startDate) {
      data = data.filter((d) => d.date >= startDate);
    }
    if (endDate) {
      data = data.filter((d) => d.date <= endDate);
    }

    const totalDonations = data.length;
    const verifiedDonations = data.filter(
      (d) => d.status?.toLowerCase() === 'verified'
    ).length;
    const pendingDonations = data.filter(
      (d) => d.status?.toLowerCase() === 'pending'
    ).length;

    // Calculate total amounts
    const totalAmount = data.reduce(
      (sum, d) => sum + parseFloat(d.amount || 0),
      0
    );
    const verifiedAmount = data
      .filter((d) => d.status?.toLowerCase() === 'verified')
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    // Category distribution
    const categoryDistribution = {};
    data.forEach((d) => {
      const category = d.category || 'Unknown';
      if (!categoryDistribution[category]) {
        categoryDistribution[category] = { count: 0, amount: 0 };
      }
      categoryDistribution[category].count++;
      categoryDistribution[category].amount += parseFloat(d.amount || 0);
    });

    // Payment method distribution
    const paymentMethodDistribution = {};
    data.forEach((d) => {
      const method = d.paymentMethod || 'Unknown';
      paymentMethodDistribution[method] =
        (paymentMethodDistribution[method] || 0) + 1;
    });

    // Type distribution
    const typeDistribution = {};
    data.forEach((d) => {
      const type = d.donationType || 'Unknown';
      if (!typeDistribution[type]) {
        typeDistribution[type] = { count: 0, amount: 0 };
      }
      typeDistribution[type].count++;
      typeDistribution[type].amount += parseFloat(d.amount || 0);
    });

    // Top donors
    const donorTotals = {};
    data
      .filter((d) => d.memberID && d.memberID !== 'Anonymous')
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
      verifiedDonations,
      pendingDonations,
      totalAmount: Math.round(totalAmount * 100) / 100,
      verifiedAmount: Math.round(verifiedAmount * 100) / 100,
      avgDonation:
        totalDonations > 0
          ? Math.round((totalAmount / totalDonations) * 100) / 100
          : 0,
      categoryDistribution,
      paymentMethodDistribution,
      typeDistribution,
      topDonors,
    });
  }
}

module.exports = new DonationsController();
