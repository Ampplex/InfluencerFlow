const nodemailer = require("nodemailer");

function sendEmail(subject, receiverEmail, body) {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ankesh3905222@gmail.com",
      pass: "zqbe zgjg dcee vani", // 🔐 Consider using environment variables for security
    },
  });

  // Define email options
  const mailOptions = {
    from: "ankesh3905222@gmail.com",
    to: receiverEmail,
    subject: subject,
    text: body,
    // html: `<p>${body}</p>` // Optional: use this if you want HTML formatting
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

sendEmail(
  "Test Subject",
  "ajaypun1976@gmail.com",
  "This is a custom message sent using nodemailer!"
);

// export
module.exports = {sendEmail}