const nodemailer = require("nodemailer");

class MailSendServise {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendMail(to, activationLink) {
    this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Activation account for ${process.env.CLIENT_URL}`,
      text: "",
      html: `
        <div>
          <h1>For activation folow the link:</h1>
           <a href="${activationLink}">${activationLink}</a>
        </div>
      `,
    });
  }
}

module.exports = new MailSendServise();
