import puppeteer from "puppeteer-core";

const EDGE_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "8mm", bottom: "8mm", left: "10mm", right: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
