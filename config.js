/*
  Edit this file. It is the only file you need to change to go live.
  See README.md for the 5-minute setup.
*/
window.SITE_CONFIG = {
  // Total seats. Also change CAPACITY in apps-script/Code.gs to the same number.
  capacity: 40,

  // Paste your Google Apps Script web app URL here (ends with /exec).
  // While this is empty, the seat counter shows a dash and the form sends students
  // to your registration form link below.
  apiUrl: "",

  // Optional. Set a number to show a fixed count while apiUrl is empty.
  manualRegistered: null,

  contactEmail: "hello@your-college.edu",

  links: {
    form: "https://forms.gle/REPLACE-WITH-YOUR-FORM-ID",           // optional backup form
    community: "https://chat.whatsapp.com/REPLACE-WITH-YOUR-INVITE", // WhatsApp or Telegram invite
    linkedin: "https://www.linkedin.com/company/REPLACE-WITH-YOUR-PAGE",
    github: "https://github.com/REPLACE-WITH-YOUR-ORG"
  }
};
