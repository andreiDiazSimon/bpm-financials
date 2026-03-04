import nodemailer from "nodemailer" 

export async function sendOtpEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: "Your One-Time Password (OTP) – Crane and Trucking",
  text: `
Hello,

You have requested to log in to your Crane and Trucking account.

Your One-Time Password (OTP) is: ${code}

This code will expire in 5 minutes for security purposes. 
Please do not share this code with anyone.

If you did not request this login attempt, please ignore this email or contact our support team immediately.

Best regards,  
Crane and Trucking Team
  `,
})
}