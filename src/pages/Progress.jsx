import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Add this import

const Progress = () => {
  const [progress, setProgress] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [questionsBySheet, setQuestionsBySheet] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // ✅ 1. Fetch all sheets
        const sheetRes = await axios.get(
          "https://dsa-tracker-0exz.onrender.com/api/sheets"
        );
        const allSheets = sheetRes.data.sheets;
        setSheets(allSheets);

        // ✅ 2. Fetch all progress
        const progressRes = await axios.get(
          "https://dsa-tracker-0exz.onrender.com/api/progress",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const progressData = progressRes.data.progress;
        setProgress(progressData);

        // ✅ 3. Fetch all questions sheet-wise
        const sheetQuestionMap = {};

        for (let sheet of allSheets) {
          const quesRes = await axios.get(
            `https://dsa-tracker-0exz.onrender.com/api/questions/${sheet._id}`
          );
          sheetQuestionMap[sheet._id] = quesRes.data.questions;
        }

        setQuestionsBySheet(sheetQuestionMap);
      } catch (error) {
        console.error("Progress fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-white">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12 bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ✅ PAGE TITLE */}
      <h1 className="text-3xl font-bold text-center mb-10">
        📊 Your Progress Overview
      </h1>

      {/* ✅ ✅ ✅ SHEET-WISE PROGRESS */}
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold mb-4 text-center">
          📂 Click on a Sheet for Detailed Progress
        </h2>

        {sheets.map((sheet) => {
          const sheetQuestions = questionsBySheet[sheet._id] || [];
          const totalSheetQ = sheetQuestions.length;

          const solvedSheetQ = sheetQuestions.filter((q) =>
            progress.some(
              (p) =>
                p.questionId === q._id && p.isSolved === true
            )
          ).length;

          const sheetPercent =
            totalSheetQ === 0
              ? 0
              : Math.round((solvedSheetQ / totalSheetQ) * 100);

          return (
            <Link
              key={sheet._id}
              to={`/progress/${sheet._id}`}
              className="block cursor-pointer"
            >
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hard)] hover:border-[var(--color-accent)] transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {sheet.title}
                    </h3>
                    <p className="text-sm text-[var(--color-muted)] mt-1">
                      {sheet.description || "Click to view detailed progress"}
                    </p>
                  </div>

                  <span className="text-sm text-[var(--color-muted)]">
                    {solvedSheetQ}/{totalSheetQ} solved
                  </span>
                </div>

                <div className="w-full bg-[var(--color-border)] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-green-400 to-[var(--color-accent)] transition-all duration-700"
                    style={{ width: `${sheetPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-[var(--color-muted)]">
                    {sheetPercent}% completed
                  </p>
                  <span className="text-xs text-[var(--color-accent)]">
                    Click for details →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Progress;