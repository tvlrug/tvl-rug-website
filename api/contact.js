import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("Missing required fields");
  }

  await resend.emails.send({
    from: "TVL-RUG Website <onboarding@resend.dev>",
    to: "contact@tvl-rug.org.uk",
    reply_to: email,
    subject: `New TVL-RUG contact form message from ${name}`,
    html: `
      <h2>New TVL-RUG website enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `,
  });

  return res.redirect(303, "/contact-success.html");
  res.end();
}
