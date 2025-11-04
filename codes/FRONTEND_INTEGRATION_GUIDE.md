# Frontend Integration Guide

## Overview

This guide shows how to integrate the business logic APIs into React components using the custom hooks.

## ✅ Completed Setup

1. **API Service Layer** - `src/services/businessLogicService.ts`
   - 23 API methods wrapping all business logic endpoints
   - Full TypeScript typing
   - Integrated with existing auth/CORS infrastructure

2. **Custom React Hooks** - `src/hooks/useBusinessLogic.ts`
   - `useGuestRegistration()` - Register guests and convert to members
   - `useGuests()` - Fetch guest lists and statistics
   - `useCheckIn()` - Check-in/out operations and attendance
   - `useDonationVerification()` - Donation submission and verification
   - `useCommunication()` - Send SMS, email, WhatsApp messages

## Usage Examples

### Guest Registration

```tsx
import { useGuestRegistration } from '@/hooks/useBusinessLogic';

function GuestRegistrationForm() {
  const { registerGuest, loading, error } = useGuestRegistration();
  
  const handleSubmit = async (formData) => {
    try {
      const result = await registerGuest({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      }, gatheringID);
      
      toast.success('Guest registered successfully!');
      console.log('Guest ID:', result.guestID);
    } catch (err) {
      toast.error(error || 'Registration failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Guest'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Check-in Interface

```tsx
import { useCheckIn } from '@/hooks/useBusinessLogic';

function CheckInInterface({ gatheringID }) {
  const { 
    checkIn, 
    checkInViaQR, 
    fetchCurrentAttendees, 
    currentAttendees, 
    loading, 
    error 
  } = useCheckIn();
  
  // Fetch attendees on mount
  useEffect(() => {
    fetchCurrentAttendees(gatheringID);
  }, [gatheringID]);
  
  const handleCheckIn = async (memberID: string) => {
    try {
      await checkIn({
        memberID,
        gatheringID,
        checkInMethod: 'manual',
        checkInBy: currentStaffID,
      });
      
      // Refresh attendee list
      fetchCurrentAttendees(gatheringID);
      toast.success('Check-in successful!');
    } catch (err) {
      toast.error(error || 'Check-in failed');
    }
  };
  
  const handleQRScan = async (qrData: string) => {
    try {
      await checkInViaQR(qrData, gatheringID);
      fetchCurrentAttendees(gatheringID);
      toast.success('QR check-in successful!');
    } catch (err) {
      toast.error(error || 'QR check-in failed');
    }
  };
  
  return (
    <div>
      <h2>Current Attendees: {currentAttendees.length}</h2>
      {loading && <Spinner />}
      {error && <Alert variant="destructive">{error}</Alert>}
      
      <QRScanner onScan={handleQRScan} />
      
      <MemberList onCheckIn={handleCheckIn} />
    </div>
  );
}
```

### Donation Verification

```tsx
import { useDonationVerification } from '@/hooks/useBusinessLogic';

function DonationDashboard() {
  const {
    fetchPendingDonations,
    verifyDonation,
    rejectDonation,
    bulkVerify,
    pendingDonations,
    loading,
    error
  } = useDonationVerification();
  
  useEffect(() => {
    fetchPendingDonations();
  }, []);
  
  const handleVerify = async (donationID: string) => {
    try {
      await verifyDonation(donationID, currentStaffID, 'Verified by staff');
      fetchPendingDonations(); // Refresh list
      toast.success('Donation verified!');
    } catch (err) {
      toast.error(error || 'Verification failed');
    }
  };
  
  const handleBulkVerify = async (selectedIDs: string[]) => {
    try {
      const result = await bulkVerify(selectedIDs, currentStaffID);
      toast.success(`${result.verified} donations verified!`);
      fetchPendingDonations();
    } catch (err) {
      toast.error(error || 'Bulk verification failed');
    }
  };
  
  return (
    <div>
      <h2>Pending Donations ({pendingDonations.length})</h2>
      {loading && <Spinner />}
      {error && <Alert variant="destructive">{error}</Alert>}
      
      <DonationTable 
        donations={pendingDonations}
        onVerify={handleVerify}
        onReject={(id, reason) => rejectDonation(id, currentStaffID, reason)}
        onBulkVerify={handleBulkVerify}
      />
    </div>
  );
}
```

### Guest List with Statistics

```tsx
import { useGuests } from '@/hooks/useBusinessLogic';

function GuestManagement() {
  const { fetchGuests, fetchStats, guests, stats, loading, error } = useGuests();
  
  useEffect(() => {
    fetchGuests(true); // Include members who were guests
    fetchStats(30); // Last 30 days
  }, []);
  
  return (
    <div>
      <div className="stats-grid">
        <MetricCard title="Total Guests" value={stats?.totalGuests || 0} />
        <MetricCard title="New Guests" value={stats?.newGuests || 0} />
        <MetricCard title="Return Visits" value={stats?.returnVisits || 0} />
        <MetricCard title="Conversion Rate" value={`${stats?.conversionRate || 0}%`} />
      </div>
      
      {loading && <Spinner />}
      {error && <Alert variant="destructive">{error}</Alert>}
      
      <GuestTable guests={guests} />
    </div>
  );
}
```

### Communication Center

```tsx
import { useCommunication } from '@/hooks/useBusinessLogic';

function CommunicationCenter() {
  const { sendEmail, sendSMS, sendBulk, loading, error } = useCommunication();
  
  const handleSendEmail = async (recipient: string, subject: string, content: string) => {
    try {
      await sendEmail(recipient, subject, content);
      toast.success('Email sent successfully!');
    } catch (err) {
      toast.error(error || 'Failed to send email');
    }
  };
  
  const handleBulkMessage = async (recipients: any[], type: 'sms' | 'email', message: string) => {
    try {
      const result = await sendBulk(recipients, type, message);
      toast.success(`Sent to ${result.sent}/${result.total} recipients`);
    } catch (err) {
      toast.error(error || 'Bulk send failed');
    }
  };
  
  return (
    <div>
      <Tabs>
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Message</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <EmailComposer onSend={handleSendEmail} loading={loading} />
        </TabsContent>
        
        <TabsContent value="sms">
          <SMSComposer onSend={(phone, msg) => sendSMS({ to: phone, message: msg })} loading={loading} />
        </TabsContent>
        
        <TabsContent value="bulk">
          <BulkMessageComposer onSend={handleBulkMessage} loading={loading} />
        </TabsContent>
      </Tabs>
      
      {error && <Alert variant="destructive">{error}</Alert>}
    </div>
  );
}
```

## Integration Checklist

### Components to Update

- [ ] **GuestTrackingModal** - Use `useGuestRegistration()` and `useGuests()`
- [ ] **DigitalCheckInModal** - Use `useCheckIn()` for check-in/out operations
- [ ] **VerifyDonationModal** - Use `useDonationVerification()` for verification workflow
- [ ] **BulkMessageModal** - Use `useCommunication()` for bulk messaging
- [ ] **MemberAttendanceModal** - Use `useCheckIn().fetchAttendanceReport()`
- [ ] **Dashboard** - Use all hooks for statistics and metrics
- [ ] **SendFollowUpModal** - Use `useCommunication()` for follow-up messages

### Features to Add

1. **Loading States**
   - Add spinners during API calls
   - Disable buttons while loading
   - Show skeleton loaders for lists

2. **Error Handling**
   - Display error messages in toasts
   - Add retry buttons for failed operations
   - Validate data before API calls

3. **Success Feedback**
   - Show success toasts
   - Clear forms after successful submission
   - Refresh data lists automatically

4. **Optimistic UI Updates**
   - Update UI immediately (before API responds)
   - Revert changes if API call fails
   - Improves perceived performance

5. **Real-time Features**
   - Poll for attendance updates every 30 seconds
   - Auto-refresh pending donations
   - WebSocket for live check-in notifications (future)

## Advanced Patterns

### Optimistic UI Update Example

```tsx
const handleCheckIn = async (memberID: string) => {
  // Optimistically update UI
  setCurrentAttendees(prev => [...prev, { memberID, name: '...' }]);
  
  try {
    await checkIn({ memberID, gatheringID, ... });
    // API success - fetch real data
    fetchCurrentAttendees(gatheringID);
  } catch (err) {
    // Revert optimistic update
    setCurrentAttendees(prev => prev.filter(a => a.memberID !== memberID));
    toast.error('Check-in failed');
  }
};
```

### Polling for Updates

```tsx
useEffect(() => {
  // Initial fetch
  fetchCurrentAttendees(gatheringID);
  
  // Poll every 30 seconds
  const interval = setInterval(() => {
    fetchCurrentAttendees(gatheringID);
  }, 30000);
  
  return () => clearInterval(interval);
}, [gatheringID]);
```

### Debounced Search

```tsx
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchGuests(true); // Search guests
  }, 300),
  []
);
```

## Error Handling Best Practices

1. **Always handle errors in try-catch blocks**
2. **Display user-friendly error messages**
3. **Log errors to console for debugging**
4. **Provide retry mechanisms for failed operations**
5. **Validate user input before API calls**

## Testing Components

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestRegistrationForm } from './GuestRegistrationForm';

test('registers guest successfully', async () => {
  render(<GuestRegistrationForm />);
  
  await userEvent.type(screen.getByLabelText('First Name'), 'John');
  await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
  await userEvent.type(screen.getByLabelText('Phone'), '08012345678');
  
  await userEvent.click(screen.getByText('Register Guest'));
  
  await waitFor(() => {
    expect(screen.getByText('Guest registered successfully!')).toBeInTheDocument();
  });
});
```

## Next Steps

1. **Update existing components** to use business logic hooks
2. **Add loading spinners** and error alerts
3. **Implement optimistic UI** for better UX
4. **Add real-time polling** for attendance updates
5. **Create integration tests** for component workflows
6. **Add PWA features** (service worker, offline support)
7. **Configure communication services** (Twilio, Nodemailer)

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [shadcn/ui Components](https://ui.shadcn.com/)
