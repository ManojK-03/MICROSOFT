# Learn Forge

A static landing and registration site for a student tech community. It runs on GitHub Pages with no build step. Registrations and the live seat counter use a free Google Sheet and a small Google Apps Script.

```
index.html            the page
config.js             the only file you edit (links, backend URL, contact email)
assets/style.css      styles
assets/app.js         form validation and seat counter
apps-script/Code.gs   the backend you paste into Google Sheets
.nojekyll             tells GitHub Pages to serve the files as they are
```

## 1. Set up the registration backend (5 minutes)

1. Create a new Google Sheet. Name it anything, for example "Learn Forge registrations".
2. Open **Extensions > Apps Script**. Delete the starter code and paste in everything from `apps-script/Code.gs`.
3. If your seat limit is not 40, change `CAPACITY` at the top.
4. Click **Deploy > New deployment**. Choose the type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and approve the permissions. Google shows a warning for scripts you wrote yourself. Choose **Advanced**, then **Go to project**.
6. Copy the **Web app URL**. It ends in `/exec`.
7. Open `config.js` and paste it into `apiUrl`.

The script creates a `Registrations` tab on its first call. Open the sheet at any time to see every student, filter it, or download it as CSV from **File > Download**. Only you can open the sheet. The public URL only returns the seat count and accepts new registrations.

If you edit `Code.gs` later, use **Deploy > Manage deployments > Edit > New version**. Saving alone does not update the live URL.

## 2. Fill in your details

Edit `config.js`:

- `links.community`: your WhatsApp or Telegram invite link
- `links.linkedin` and `links.github`: your community pages
- `links.form`: an optional backup Google Form. Leave the placeholder to hide it.
- `contactEmail`: your contact address

Also replace "Learn Forge", "Your College Name, City" and the contact email in `index.html` with your own. Search for them with your editor.

## 3. Publish on GitHub Pages

1. Create a GitHub repository and upload all these files, keeping the folder structure. Or run:
   ```
   git init
   git add .
   git commit -m "Launch site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Choose branch **main** and folder **/ (root)**. Save.
4. After a minute, your site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## How the seat limit works

- The page reads the count from your sheet every 30 seconds and after each registration.
- The script itself refuses a registration once the limit is reached, so the cap holds even if someone bypasses the page.
- A second registration with the same email is recognized and not counted twice.
- A hidden field catches simple bots.

## Limits to know about

- The sheet counts rows, so deleting a row frees a seat.
- Anyone can send data straight to the public URL. The script validates every field and enforces the cap, but check the sheet for odd entries before you send invitations.
- Free email addresses such as Gmail are rejected so that only college emails register. Remove `FREE_MAIL` checks in `app.js` and `Code.gs` if your college uses Gmail.
- The footer says the community is independent and not endorsed by Microsoft or Google. Keep it unless you are officially recognized.
