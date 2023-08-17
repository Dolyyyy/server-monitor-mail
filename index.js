const axios = require("axios");
const nodemailer = require("nodemailer");

class WebsiteMonitor {
  constructor(websiteUrls, smtpConfig) {
    this.websiteUrls = websiteUrls;
    this.smtpConfig = smtpConfig;
    this.websiteStatusMap = {};
    this.transporter = nodemailer.createTransport(this.smtpConfig);
    this.startMonitoring();
  }

  async sendNotification(websiteUrl, isDown, errorDetails) {
    const statusMessage = isDown ? "is down" : "is back online";
    const currentTime = new Date().toLocaleString("en");
    const serverIP = await axios
      .get("https://api64.ipify.org?format=json")
      .then((response) => response.data.ip);

    const mailOptions = {
      from: "noreply@codoly.fr", // From SMTP server adress, set what you want !
      to: "XXXXX@gmail.com", // Mail adresse you want to receise notification, you can add "cc:" to add several adresses
      subject: `[${currentTime}] ${websiteUrl} ${statusMessage}`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #333333;
              }
              strong {
                color: #444444;
              }
              p {
                color: #666666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <center><img src="https://threatpicture.com/wp-content/uploads/linux-torvalds-penguin-painting.jpg" height="150"></img></center>
              <h1>${websiteUrl} or webserver is down</h1>
              <p><strong>Website:</strong> ${websiteUrl}</p>
              <p><strong>Detection Time:</strong> ${currentTime}</p>
              <p><strong>Server IP:</strong> ${serverIP}</p>
              <p><strong>Error Message:</strong> ${
                isDown ? errorDetails.message : "N/A"
              }</p>
              <p><strong>Error Details:</strong> ${
                isDown ? errorDetails.stack : "N/A"
              }</p>
              <br><br><br><div>Monitoring by <a href="https://codoly.fr">Doly</a> for <b>${websiteUrl}</b></div>
            </div>
          </body>
        </html>
      `,
    };

    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(
          `[${new Date().toLocaleString("en")}] Error sending email:`,
          error
        );
      } else {
        console.log(
          `[${new Date().toLocaleString("en")}] Email sent :`,
          info.response
        );
      }
    });
  }

  async checkWebsiteStatus(websiteUrl) {
    try {
      await axios.get(websiteUrl);
      if (this.websiteStatusMap[websiteUrl]) {
        console.log(
          `[${new Date().toLocaleString("en")}] ${websiteUrl} is back online.`
        );
        this.sendNotification(websiteUrl, false, {});
        this.websiteStatusMap[websiteUrl] = false;
      } else {
        console.error(
          `[${new Date().toLocaleString("en")}] ${websiteUrl} is up.`
        );
      }
    } catch (error) {
      console.error(
        `[${new Date().toLocaleString("en")}] ${websiteUrl} is down:`,
        error.message
      );
      if (!this.websiteStatusMap[websiteUrl]) {
        this.sendNotification(websiteUrl, true, error);
        this.websiteStatusMap[websiteUrl] = true;
      }
    }
  }

  startMonitoring() {
    console.log(`[${new Date().toLocaleString("en")}] Start monitoring...`);
    this.websiteUrls.forEach((url) => {
      this.websiteStatusMap[url] = false;
      this.checkWebsiteStatus(url);
      setInterval(() => this.checkWebsiteStatus(url), 120000);
    });
  }
}

const websiteUrls = ["https://codoly.fr"];

const smtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "XXXX@gmail.com", // For GMAIL SMTP users, or replace with your own SMTP server ;)
    pass: "XXXXXXXXXXXXXX", // Your SMTP user password
  },
};

new WebsiteMonitor(websiteUrls, smtpConfig);
