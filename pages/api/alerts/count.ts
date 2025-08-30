import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Alert from "@/models/Alert";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Counting total alerts in database...");

    // Ensure database connection
    await dbConnect();

    // Count all alerts
    const totalAlerts = await Alert.countDocuments({});

    // Count by status
    const activeAlerts = await Alert.countDocuments({
      status: "active",
      isActive: true,
    });
    const resolvedAlerts = await Alert.countDocuments({ status: "resolved" });
    const expiredAlerts = await Alert.countDocuments({ status: "expired" });

    // Count by type
    const typeCounts = await Alert.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log(`Total alerts: ${totalAlerts}`);
    console.log(
      `Active: ${activeAlerts}, Resolved: ${resolvedAlerts}, Expired: ${expiredAlerts}`
    );

    return res.status(200).json({
      success: true,
      data: {
        total: totalAlerts,
        byStatus: {
          active: activeAlerts,
          resolved: resolvedAlerts,
          expired: expiredAlerts,
        },
        byType: typeCounts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error counting alerts:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to count alerts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
