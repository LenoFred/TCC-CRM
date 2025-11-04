$filePath = "src/test/components/Dashboard.test.tsx"
$content = Get-Content $filePath -Raw

# Fix the malformed mock returns
$content = $content -replace 'submitDonation: vi\.fn\(\),`n\s+verifyDonation: vi\.fn\(\),`n\s+rejectDonation: vi\.fn\(\),`n\s+bulkVerify: vi\.fn\(\),`n\s+fetchPendingDonations: vi\.fn\(\),`n\s+fetchStats: vi\.fn\(\),`n\s+getReceipt: vi\.fn\(\),\s+verifyDonation: vi\.fn\(\),\s+rejectDonation: vi\.fn\(\),`n\s+\}', 'submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    }'

# Add missing properties to mocks that don't have them
$pattern = '(useDonationVerification\)\)\.mockReturnValue\(\{[\s\S]*?)(fetchPendingDonations: vi\.fn\(\),\s+fetchStats: vi\.fn\(\),\s+verifyDonation: vi\.fn\(\),\s+rejectDonation: vi\.fn\(\),\s+\})'
$replacement = '$1submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    }'
$content = $content -replace $pattern, $replacement

$content | Set-Content $filePath -NoNewline
Write-Host "Fixed Dashboard.test.tsx"
