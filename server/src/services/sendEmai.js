import nodemailer from "nodemailer";

export function sendEmail(subject: string, receiverEmail: string, body: string): void {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ankesh3905222@gmail.com",
      pass: "zqbe zgjg dcee vani", // Hardcoded password — not secure for production
    },
  });

  const mailOptions = {
    from: "ankesh3905222@gmail.com",
    to: receiverEmail,
    subject,
    text: body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
