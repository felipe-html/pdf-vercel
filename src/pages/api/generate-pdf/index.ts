// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import ejs from "ejs";
import path from "path";
import Cors from "cors";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import chrome from "chrome-aws-lambda";

const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      await runMiddleware(req, res, cors);

      let puppeteerInstance;

      if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        puppeteerInstance = puppeteerCore;
      } else {
        puppeteerInstance = puppeteer;
      }

      let options = {};

      if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        options = {
          args: [...chrome.args, "--hide-scrollbars", "disable-web-security"],
          defaultViewport: chrome.defaultViewport,
          executablePath: await chrome.executablePath,
          headless: "new",
          ignoreHTTPSErrors: true,
        };
      }

      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto("https://www.google.com");
      const title = await page.title();
      return res.send({ page, title, message: "Deu bom" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
