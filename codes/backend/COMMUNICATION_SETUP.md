# Communication Setup Guide

This guide will help you configure Twilio (SMS/WhatsApp) and Nodemailer (Email) for the TCC CRM system.

## Prerequisites

1. **Twilio Account** (for SMS and WhatsApp)
   - Sign up at https://www.twilio.com/
   - Free trial includes $15 credit
   - Paid plans start at pay-as-you-go

2. **Email Service** (for Email notifications)
   - Gmail Account (recommended for testing)
   - Or any SMTP service (SendGrid, AWS SES, etc.)

## Step 1: Twilio Setup

### Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your phone number
4. Complete the onboarding questionnaire

### Get Twilio Credentials

1. **Go to Console Dashboard**: https://console.twilio.com/
2. **Find your credentials**:
   - **Account SID**: Found on dashboard (starts with `AC...`)
   - **Auth Token**: Click "Show" to reveal (starts with random chars)
3. **Get a Phone Number**:
   - Go to Phone Numbers → Manage → Buy a number
   - Select a number with SMS capabilities
   - For US numbers: typically $1/month
   - Copy your phone number (format: +1234567890)

### Enable WhatsApp (Optional)

1. Go to **Messaging → Try it out → Send a WhatsApp message**
2. Follow Twilio's WhatsApp Sandbox setup
3. Send a message to join the sandbox: `join <your-sandbox-keyword>`
4. Copy your WhatsApp number (format: whatsapp:+14155238886)

**Note**: Production WhatsApp requires business verification and takes 1-2 weeks

## Step 2: Email Setup

### Option A: Gmail (Easiest for Testing)

1. **Enable 2-Factor Authentication**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "TCC CRM"
   - Copy the 16-character password (no spaces)

3. **Your Email Credentials**:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `false` (uses STARTTLS)
   - User: Your Gmail address
   - Pass: The 16-character app password

### Option B: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com/ (Free tier: 100 emails/day)
2. Create API key: Settings → API Keys → Create API Key
3. Verify sender email: Settings → Sender Authentication
4. Your credentials:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - User: `apikey` (literally the word "apikey")
   - Pass: Your API key

### Option C: AWS SES (Best for Scale)

1. Sign up for AWS: https://aws.amazon.com/ses/
2. Verify your domain or email
3. Create SMTP credentials in SES Console
4. Start in sandbox mode (50 emails/day)
5. Request production access for unlimited

## Step 3: Configure Environment Variables

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create `.env` file** (or update existing):
   ```bash
   # Copy from .env.example
   cp .env.example .env
   ```

3. **Add your credentials to `.env`**:

```env
# Twilio Configuration (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=TCC Church
EMAIL_FROM_ADDRESS=your-email@gmail.com

# Optional: Reply-to email
EMAIL_REPLY_TO=admin@tccchurch.com
```

## Step 4: Install Dependencies

The required packages are already in package.json, but ensure they're installed:

```bash
cd backend
npm install twilio nodemailer
```

Packages:
- `twilio`: SMS and WhatsApp messaging
- `nodemailer`: Email sending

## Step 5: Uncomment Communication Code

The communication service is already implemented but commented out for safety. To activate:

1. Open `backend/src/services/communicationService.js`

2. **Uncomment Twilio initialization** (lines ~14-42):
   ```javascript
   const twilio = require('twilio');
   
   // In initialize() method:
   this.twilioClient = twilio(
     config.communications.twilio.accountSid,
     config.communications.twilio.authToken
   );
   this.twilioEnabled = true;
   ```

3. **Uncomment SMS sending** (lines ~88-103):
   ```javascript
   if (this.twilioEnabled) {
     const result = await this.twilioClient.messages.create({
       body: message,
       from: config.communications.twilio.phoneNumber,
       to: phoneNumber,
     });
     // ... rest of SMS code
   }
   ```

4. **Uncomment WhatsApp sending** (lines ~120-140):
   ```javascript
   if (this.twilioEnabled) {
     const result = await this.twilioClient.messages.create({
       body: message,
       from: config.communications.twilio.whatsappNumber,
       to: `whatsapp:${phoneNumber}`,
     });
     // ... rest of WhatsApp code
   }
   ```

5. **Uncomment Email sending** (lines ~155-180):
   ```javascript
   if (this.emailEnabled) {
     const info = await this.emailTransport.sendMail({
       from: `"${config.communications.email.fromName}" <${config.communications.email.fromAddress}>`,
       to: emailAddress,
       subject,
       text: message,
       html: htmlContent,
     });
     // ... rest of Email code
   }
   ```

## Step 6: Test the Setup

### Test Twilio SMS

1. Start your backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Use the API endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/business-logic/communication/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "channel": "sms",
       "recipients": ["+1234567890"],
       "message": "Test message from TCC CRM",
       "metadata": {
         "campaign": "test"
       }
     }'
   ```

3. Check your phone for the SMS

### Test Email

```bash
curl -X POST http://localhost:5000/api/business-logic/communication/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "channel": "email",
    "recipients": ["test@example.com"],
    "subject": "Test Email from TCC CRM",
    "message": "This is a test email message.",
    "metadata": {
      "campaign": "test"
    }
  }'
```

### Test WhatsApp

```bash
curl -X POST http://localhost:5000/api/business-logic/communication/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "channel": "whatsapp",
    "recipients": ["whatsapp:+1234567890"],
    "message": "Test WhatsApp message from TCC CRM",
    "metadata": {
      "campaign": "test"
    }
  }'
```

## Step 7: Test from Frontend

1. Start your frontend:
   ```bash
   cd codes
   npm run dev
   ```

2. Navigate to **Communications** page
3. Click **Send Bulk Message**
4. Fill in the form:
   - Select channel (SMS, Email, or WhatsApp)
   - Enter test recipients
   - Write message
   - Click Send
5. Check delivery status in the response

## Troubleshooting

### Twilio Issues

**Error: "Authenticate"**
- Double-check Account SID and Auth Token
- Ensure no extra spaces in .env file

**Error: "Unverified number"**
- Twilio trial accounts can only send to verified numbers
- Verify your test numbers in Console → Phone Numbers → Verified Caller IDs
- Or upgrade to paid account

**Error: "Invalid phone number"**
- Use E.164 format: +[country code][number]
- Example: +12345678900 (not 123-456-7890)

### Email Issues

**Error: "Invalid login"**
- Gmail: Ensure you're using App Password, not regular password
- Enable 2FA first, then create App Password

**Error: "Connection timeout"**
- Check firewall settings
- Try port 465 with `secure: true`
- Ensure EMAIL_HOST is correct

**Error: "Recipient address rejected"**
- Gmail: Email must be sent from the account you authenticated with
- Use EMAIL_FROM_ADDRESS = EMAIL_USER

### WhatsApp Issues

**Message not delivered**
- Ensure recipient joined sandbox: send "join [keyword]" to Twilio WhatsApp number
- Use correct format: `whatsapp:+1234567890`
- Production WhatsApp requires business verification

## Cost Estimates

### Twilio (SMS)
- **US/Canada**: $0.0079 per SMS
- **International**: $0.03 - $0.50 per SMS
- **WhatsApp**: $0.005 per conversation (24-hour window)

### Email
- **Gmail**: Free (limited to ~500/day)
- **SendGrid**: Free tier (100 emails/day), then $19.95/month (50k emails)
- **AWS SES**: $0.10 per 1,000 emails

### Recommended Starting Point
- **Free tier**: Gmail (email) + Twilio trial (SMS)
- **Cost**: $0 for first 30 days
- **Paid**: Twilio pay-as-you-go (~$20/month for moderate use)

## Production Checklist

- [ ] Twilio account created and verified
- [ ] Phone number purchased
- [ ] Email service configured
- [ ] Environment variables set
- [ ] Communication code uncommented
- [ ] Test messages sent successfully
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Monitoring/logging enabled
- [ ] Backup communication method (if critical)

## Support

- **Twilio Support**: https://support.twilio.com/
- **Twilio Docs**: https://www.twilio.com/docs
- **Nodemailer Docs**: https://nodemailer.com/
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833

## Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Rotate credentials regularly** - Every 90 days recommended
3. **Use environment-specific credentials** - Different for dev/staging/production
4. **Monitor usage** - Set up billing alerts in Twilio
5. **Validate phone numbers** - Prevent invalid number charges
6. **Rate limit** - Prevent abuse and unexpected bills

## Next Steps

After setup:
1. Test all three channels (SMS, Email, WhatsApp)
2. Configure message templates in the system
3. Set up scheduled messages
4. Monitor delivery rates
5. Implement retry logic for failed sends
6. Add webhooks for delivery status
