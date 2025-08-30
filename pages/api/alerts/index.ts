import { NextApiRequest, NextApiResponse } from "next";
import AlertController from "@/controllers/AlertController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return AlertController(req, res);
}
