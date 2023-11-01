// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import ejs from "ejs";
import path from "path";
import puppeteer from "puppeteer";
import Cors from "cors";

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
      try {
        await runMiddleware(req, res, cors);

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        const fileConfigs = {
          noChildren: "30%",
          oneChildren: "10%",
          twoChildren: "50%",
          threeChildren: "8%",
          fourOrMoreChildren: "3.5%",
        };

        const filePath = path.join(
          "https://pdf-microservice.vercel.app/api/",
          "generate-pdf/models/model.ejs"
        );

        ejs.renderFile(filePath, { fileConfigs }, async (error, html) => {
          if (error) {
            return res.status(500).json({
              message: "There was an error generating the ejs file",
              timeStamp: new Date(),
              error,
            });
          }

          await page.setContent(html);
          const pdf = await page.pdf({
            printBackground: true,
            height: "828px",
            width: "1280px",
          });

          await browser.close();
          return res.status(200).json({ pdf });
        });
      } catch (error) {
        return res.status(500).json({
          message: "There was an error generating the ejs file",
          error,
        });
      }
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
