# Connect the app to Google Sheets (advanced, optional)

> **Most people don't need this.** The app works fully on its own, and **Settings → Sync & Backup → Sync through a folder** shares data between phones with no setup. Use this only if you want your transactions in a Google Sheet you can open and edit.

The app keeps a copy of your data on the phone and syncs it with a Google Sheet through a small
Apps Script web app that lives inside your own sheet. No Google Cloud project or sign-in is needed.

## One-time setup (about 3 minutes)

1. Create a new Google Sheet (any name, e.g. "Expense Tracker").
2. In the sheet open **Extensions → Apps Script**.
3. Delete the default code and paste the contents of [`Code.gs`](./Code.gs).
4. *(Recommended)* Set a secret on the line `var SECRET = '';`, for example `var SECRET = 'my-long-random-text';`.
5. Click **Deploy → New deployment**, choose the gear icon → **Web app**, then set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Click **Deploy**, approve the permissions prompt, and copy the **Web app URL** (ends in `/exec`).
7. In the app open **Settings → Google Sheet**, paste the URL (and the secret if you set one) and tap **Save & Connect**.

The script creates two tabs automatically: **Transactions** and **Categories**.

## Good to know

- **Offline:** entries are saved on the phone first and uploaded when the internet is available.
- **Sheet is the source of truth:** you can edit rows in the sheet and the app picks the changes up on the next sync.
  Keep the header row and the `id` column intact.
- **Changing the script later:** use **Deploy → Manage deployments → Edit → New version**, otherwise the app keeps running the old code.
- **Privacy:** "Anyone" means anyone who has the URL can call it. Keep the URL private and use a secret.
