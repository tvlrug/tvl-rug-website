export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { name, email, message } = req.body;

  // VERY basic validation
  if (!name || !email || !message) {
    return res.status(400).send("Missing fields");
  }

  // For now just log (we'll wire email next)
  console.log("Contact form submission:", { name, email, message });

  // Redirect to success page
  res.writeHead(302, { Location: "/success.html" });
  res.end();
}
