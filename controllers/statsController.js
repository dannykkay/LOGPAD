const { StatusCodes } = require("http-status-codes");
const Note = require("../models/Note.js");
const mongoose = require("mongoose");
const getNoteStats = async (req, res) => {
  const stats = await Note.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
        isDeleted: false,
      },
    },
    //$facet for multi pipeline in one query
    {
      $facet: {
        totalNotes: [
          {
            $count: "count",
          },
        ],
        pinnedNotes: [
          {
            $match: {
              isPinned: true,
            },
          },
          {
            $count: "count",
          },
        ],
        priorityStats: [
          {
            $group: {
              _id: "$priority",

              count: {
                $sum: 1,
              },
            },
          },
        ],
        categoryStats: [
          {
            $group: {
              _id: "$category",

              count: {
                $sum: 1,
              },
            },
          },
          //highest category first
          {
            $sort: {
              count: -1,
            },
          },
        ],
      },
    },
  ]);
  //aggregation returns arr
  const data = stats[0];
  const totalNotes = data.totalNotes[0]?.count || 0;
  const pinnedNotes = data.pinnedNotes[0]?.count || 0;
  // Transform priority array into object
  const priorityStats = data.priorityStats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;

    return acc;
  }, {});

  const categoryStats = data.categoryStats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
  res.status(StatusCodes.OK).json({
    success: true,
    totalNotes,
    pinnedNotes,
    priorityStats,
    categoryStats,
  });
};
const getMonthlyStats = async (req, res) => {
  const stats = await Note.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },

          month: {
            $month: "$createdAt",
          },
        },

        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
    {
      $project: {
        _id: 0,

        month: {
          $concat: [
            {
              $toString: "$_id.year",
            },

            "-",

            {
              $cond: {
                if: {
                  $lt: ["$_id.month", 10],
                },

                then: {
                  $concat: [
                    "0",
                    {
                      $toString: "$_id.month",
                    },
                  ],
                },

                else: {
                  $toString: "$_id.month",
                },
              },
            },
          ],
        },

        count: 1,
      },
    },
  ]);
  res.status(StatusCodes.OK).json({
    success: true,
    monthlyStats: stats,
  });
};
module.exports = { getNoteStats, getMonthlyStats };
