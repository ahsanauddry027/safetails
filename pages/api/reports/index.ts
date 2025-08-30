import { NextApiRequest, NextApiResponse } from "next";
import ReportController from "@/controllers/ReportController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return ReportController(req, res);
}
