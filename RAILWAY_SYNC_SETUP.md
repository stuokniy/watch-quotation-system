# Railway WhatsApp Sync Service Setup Guide

Deploy the WhatsApp synchronization service to Railway for 24/7 automatic chat record synchronization.

## Overview

The sync service will:
- ✅ Run 24/7 without your computer needing to be on
- ✅ Automatically export WhatsApp chat records every minute
- ✅ Upload to your cloud application
- ✅ Parse and extract quotations automatically
- ✅ Cost: FREE (included in your $5/month Railway credit)

## Quick Start

### Step 1: Push Updated Files to GitHub

```cmd
cd Desktop\watch-quotation-system
git add tools/whatsapp-sync-service.mjs Dockerfile.sync
git commit -m "Fix: Standalone WhatsApp sync service without OAuth dependency"
git push
```

### Step 2: Update Railway Sync Service

If you already have a "whatsapp-sync" service in Railway:

1. Go to https://railway.app
2. Open your "watch-quotation-system" project
3. Click on the "whatsapp-sync" service
4. Click "Redeploy" to pull the latest code
5. Wait for the deployment to complete (~5 minutes)

If you don't have the service yet:

1. Go to https://railway.app
2. Open your "watch-quotation-system" project
3. Click "+ New"
4. Select "Deploy from GitHub repo"
5. Select your "watch-quotation-system" repository
6. Railway will auto-detect `Dockerfile.sync`

### Step 3: Configure Environment Variables

In the "whatsapp-sync" service, click "Variables" and add:

```
API_URL = https://watch-quotation-system-production.up.railway.app/api/trpc
SYNC_INTERVAL = 60000
USER_ID = 1
WHATSAPP_GROUPS = (leave empty for now, we'll add groups after QR code login)
```

### Step 4: Wait for Deployment

The service will:
1. Build the Docker image (~5-10 minutes)
2. Start the service
3. Display a QR code in the logs

### Step 5: Scan QR Code to Login

1. In Railway, click on the "whatsapp-sync" service
2. Click "Logs" tab
3. Look for the QR code (should appear within 2-5 minutes)
4. Scan it with your phone's WhatsApp camera
5. Confirm login on your phone

You should see messages like:
```
[2024-01-07T10:30:45.123Z] [INFO] ✅ WhatsApp client is ready!
```

### Step 6: Get Your WhatsApp Group IDs

Once logged in, you need to add your WhatsApp group IDs to sync. You can:

**Option A: Use the Web Interface**
1. Visit your app: https://watch-quotation-system-production.up.railway.app
2. Go to Settings/Sync page
3. Configure groups there

**Option B: Manually Add Group IDs**
1. In Railway logs, you'll see available groups listed
2. Copy the group IDs (format: `120363123456789@g.us`)
3. Update the `WHATSAPP_GROUPS` environment variable:
   ```
   WHATSAPP_GROUPS = 120363123456789@g.us,120363987654321@g.us,120363456789012@g.us
   ```
4. Redeploy the service

### Step 7: Verify Sync is Working

1. Check Railway logs - you should see:
   ```
   [2024-01-07T10:31:05.123Z] [INFO] Starting sync cycle #1...
   [2024-01-07T10:31:15.456Z] [INFO] Exported 50 messages from group: Watch Trading
   [2024-01-07T10:31:25.789Z] [INFO] ✅ Uploaded chat from group: Watch Trading
   ```

2. Visit your app and check if quotations appear

## Troubleshooting

### Issue: No QR Code Appearing

**Symptoms:** Service runs but no QR code in logs after 5 minutes

**Solutions:**
1. Check if Chromium is downloading:
   ```
   Look for: "Chromium downloading" in logs
   ```
2. Wait 5-10 minutes for first-time Chromium download
3. If still not working, restart the service:
   - In Railway, click "Restart" on the whatsapp-sync service
4. Check for errors in logs

### Issue: OAuth Error

**Symptoms:** 
```
[OAuth] ERROR: OAUTH_SERVER_URL is not configured!
```

**Solution:**
This should be fixed with the new standalone sync service. If you still see this:
1. Make sure you're using `whatsapp-sync-service.mjs` (not the old tool)
2. Redeploy the service with latest code

### Issue: Sync Not Working

**Symptoms:** Service running but no sync activity in logs

**Solutions:**
1. Check if `WHATSAPP_GROUPS` is configured
2. Verify group IDs are in correct format: `120363123456789@g.us`
3. Check if WhatsApp login was successful (look for "✅ WhatsApp client is ready!")
4. Verify `API_URL` is correct

### Issue: Service Keeps Restarting

**Symptoms:** Service restarts every few minutes

**Solutions:**
1. Check logs for error messages
2. Verify all environment variables are set
3. Check if Chromium is downloading (first deployment takes longer)
4. Wait 10+ minutes for initial setup

### Issue: WhatsApp Blocks the Session

**Symptoms:** "WhatsApp blocked this login" message

**Solutions:**
1. Confirm login on your phone when prompted
2. Try with a different WhatsApp account
3. Wait 24 hours before trying again
4. Contact WhatsApp support

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | - | URL to your main app API |
| `SYNC_INTERVAL` | No | 60000 | Sync interval in milliseconds |
| `USER_ID` | No | 1 | User ID for API calls |
| `WHATSAPP_GROUPS` | No | - | Comma-separated group IDs |

## Monitoring

### View Sync Status

1. Go to https://railway.app
2. Click on "whatsapp-sync" service
3. Click "Logs" tab
4. View real-time sync activity

### Sync Metrics

Look for lines like:
```
[INFO] Sync cycle completed. Uploaded 3/3 chats. Stats: {
  "totalSyncs": 5,
  "successfulSyncs": 5,
  "failedSyncs": 0,
  "messagesProcessed": 250,
  "quotationsFound": 15
}
```

## Cost Analysis

### Railway Pricing

- Free tier: $5/month credit
- Sync tool usage: ~$1-2/month
- Main app usage: ~$2-3/month
- **Total: Usually FREE (within $5 credit)**

## Advanced Configuration

### Change Sync Interval

Edit the `SYNC_INTERVAL` environment variable:
- `30000` = 30 seconds (more frequent, higher cost)
- `60000` = 60 seconds (default)
- `300000` = 5 minutes (less frequent, lower cost)

### Monitor Multiple WhatsApp Accounts

Create separate services for each account:
1. Create new service in Railway
2. Deploy with same code
3. Each service gets its own QR code
4. Scan with different WhatsApp accounts

### Backup WhatsApp Session

The WhatsApp session is stored in `.wwebjs_auth` directory. Railway automatically backs this up.

## Support & Help

If you encounter issues:

1. **Check logs first** - Most issues are visible in Railway logs
2. **Review troubleshooting section** above
3. **Check your app's Sync page** for status
4. **Contact Railway support** - https://railway.app/support

## Next Steps

1. ✅ Push files to GitHub
2. ✅ Create/update sync service in Railway
3. ✅ Configure environment variables
4. ✅ Scan QR code to login
5. ✅ Add WhatsApp group IDs
6. ✅ Verify sync is working
7. ✅ Monitor in your app

Your WhatsApp sync service is now ready for 24/7 operation!
