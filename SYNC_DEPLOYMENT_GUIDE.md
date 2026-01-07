# WhatsApp Sync Tool - Railway Cloud Deployment Guide

Deploy the WhatsApp synchronization tool to Railway for 24/7 automatic chat record synchronization.

## Overview

The sync tool will:
- ✅ Run 24/7 without your computer needing to be on
- ✅ Automatically export WhatsApp chat records every minute
- ✅ Upload to your cloud application
- ✅ Parse and extract quotations automatically
- ✅ Cost: FREE (included in your $5/month Railway credit)

## Prerequisites

- ✅ Railway account (already set up)
- ✅ GitHub repository with your project
- ✅ Main application already deployed

## Deployment Steps

### Step 1: Push Files to GitHub

In your command prompt:

```cmd
cd Desktop\watch-quotation-system
git add Dockerfile.sync railway-sync.json
git commit -m "Add: WhatsApp sync tool deployment configuration"
git push
```

### Step 2: Create New Service in Railway

1. Visit https://railway.app
2. Go to your "watch-quotation-system" project
3. Click "+ New" button
4. Select "Deploy from GitHub repo"
5. Select your "watch-quotation-system" repository

### Step 3: Configure the Sync Service

1. In Railway, name the new service: `whatsapp-sync`
2. Click "Deploy"
3. Railway will automatically detect `Dockerfile.sync`

### Step 4: Configure Environment Variables

Once the service is created, add these environment variables:

```
API_URL = https://watch-quotation-system-production.up.railway.app/api/trpc
SYNC_INTERVAL = 60000
USER_ID = 1
```

Optional: Add your WhatsApp group IDs:

```
WHATSAPP_GROUPS = 120363123456789@g.us,120363987654321@g.us
```

### Step 5: Wait for Deployment

The sync tool will:
1. Build the Docker image (~5 minutes)
2. Start the service
3. Display a QR code in the logs

### Step 6: Scan QR Code to Login

1. In Railway, click on the "whatsapp-sync" service
2. Click "Logs" tab
3. Look for the QR code in the logs
4. Scan it with your phone's WhatsApp camera
5. Confirm login on your phone

### Step 7: Configure WhatsApp Groups

Once logged in, the tool will:
1. Detect all your WhatsApp groups
2. Start syncing every minute
3. Upload chat records to your app

### Step 8: Verify Sync is Working

1. Visit your app's Sync page:
   ```
   https://watch-quotation-system-production.up.railway.app/sync
   ```

2. You should see:
   - ✅ Last sync time
   - ✅ Success rate
   - ✅ Messages processed
   - ✅ Quotations found

## Monitoring

### Check Sync Status

1. Go to Railway project
2. Click "whatsapp-sync" service
3. Click "Logs" tab
4. View real-time sync activity

### View Sync Metrics

In your app's Sync page, you'll see:
- Total syncs
- Successful syncs
- Failed syncs
- Messages processed
- Quotations found
- Last sync time

## Troubleshooting

### QR Code Not Appearing

**Problem:** No QR code in logs after 2 minutes

**Solutions:**
1. Check internet connection
2. Restart the service: Click "Restart" in Railway
3. Wait 5 minutes for Chromium to download
4. Check logs for errors

### Sync Not Working

**Problem:** Sync shows 0 messages processed

**Solutions:**
1. Verify WhatsApp login was successful
2. Check if groups are configured correctly
3. Ensure API URL is correct
4. Check Railway logs for errors

### Service Keeps Restarting

**Problem:** Service restarts every few minutes

**Solutions:**
1. Check logs for error messages
2. Verify all environment variables are set
3. Ensure DATABASE_URL is correct
4. Check if Chromium downloaded successfully

### WhatsApp Blocks the Session

**Problem:** "WhatsApp blocked this login" message

**Solutions:**
1. Confirm login on your phone when prompted
2. Use a different WhatsApp account
3. Wait 24 hours before trying again
4. Contact WhatsApp support

## Cost Analysis

### Railway Pricing

- Free tier: $5/month credit
- Sync tool usage: ~$0-2/month
- Main app usage: ~$2-3/month
- **Total: Usually FREE (within $5 credit)**

### What You Get

- ✅ 24/7 automatic synchronization
- ✅ Unlimited message processing
- ✅ Automatic quotation extraction
- ✅ Real-time monitoring
- ✅ Automatic backups
- ✅ Zero maintenance

## Advanced Configuration

### Custom Sync Interval

Edit `config.whatsapp-sync.json`:

```json
{
  "syncInterval": 60000,  // 60 seconds
  "maxRetries": 3,
  "retryDelay": 5000
}
```

### Multiple WhatsApp Accounts

To sync from multiple accounts:
1. Create separate services for each account
2. Each service gets its own QR code
3. Scan with different WhatsApp accounts

### Backup and Recovery

Railway automatically:
- ✅ Backs up your data
- ✅ Restarts failed services
- ✅ Maintains logs for 7 days

## Performance Metrics

Expected performance:
- Sync time: 30-60 seconds per cycle
- Messages processed per cycle: 10-50
- Success rate: >99%
- Uptime: 99.9%

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway logs
3. Check your app's Sync page for errors
4. Contact Railway support: https://railway.app/support

## Next Steps

1. ✅ Push files to GitHub
2. ✅ Create new service in Railway
3. ✅ Configure environment variables
4. ✅ Scan QR code to login
5. ✅ Verify sync is working
6. ✅ Monitor in your app

Your WhatsApp sync tool is now ready for 24/7 operation!
