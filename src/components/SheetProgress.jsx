import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const SheetProgress = () => {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Sheet Details
        const sheetRes = await axios.get(
          `https://dsa-tracker-0exz.onrender.com/api/sheets/${sheetId}`
        );
        setSheet(sheetRes.data.sheet);

        // 2. Fetch Questions of This Sheet
        const quesRes = await axios.get(
          `https://dsa-tracker-0exz.onrender.com/api/questions/${sheetId}`
        );
        setQuestions(quesRes.data.questions);

        // 3. Fetch User Progress
        const progressRes = await axios.get(
          "https://dsa-tracker-0exz.onrender.com/api/progress",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProgress(progressRes.data.progress);
      } catch (err) {
        console.error("Sheet Progress Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, [sheetId, token]);

  // OVERALL SHEET PROGRESS
  const totalQuestions = questions.length;
  const solvedQuestions = questions.filter((q) =>
    progress.some(
      (p) => (p.questionId?._id || p.questionId) === q._id && p.isSolved === true
    )
  ).length;

  const percentage =
    totalQuestions === 0
      ? 0
      : Math.round((solvedQuestions / totalQuestions) * 100);

  // TOPIC WISE LOGIC
  const topicStats = {};

  questions.forEach((q) => {
    const topicsArray = q.topics || (q.topic ? [q.topic] : []);

    topicsArray.forEach((topic) => {
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, solved: 0, attempted: 0 };
      }

      topicStats[topic].total += 1;

      const progressRecord = progress.find(
        (p) => (p.questionId?._id || p.questionId) === q._id
      );

      if (progressRecord) {
        if (progressRecord.isSolved === true) {
          topicStats[topic].solved += 1;
          topicStats[topic].attempted += 1;
        } else if (progressRecord.isSolved === false) {
          topicStats[topic].attempted += 1;
        }
      }
    });
  });

  // Only topics with at least 1 solved question
  const filteredTopics = Object.entries(topicStats).filter(
    ([_, value]) => value.solved > 0
  );

  // CIRCULAR PROGRESS (main)
  const CircularProgress = ({
    size = 160,
    strokeWidth = 12,
    progress,
    label,
    value,
    total,
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getProgressColor = (percent) => {
      if (percent >= 80) return "#10B981"; // green-500
      if (percent >= 50) return "#F59E0B"; // yellow-500
      if (percent >= 20) return "#3B82F6"; // blue-500
      return "#EF4444"; // red-500
    };

    const progressColor = getProgressColor(progress);

    return (
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              className="fill-none stroke-gray-700/50"
              strokeLinecap="round"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              stroke={progressColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">
              {value}
              <span className="text-lg text-gray-400">/{total}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        </div>
      </div>
    );
  };

  // SMALL CIRCULAR PROGRESS (for topic cards)
  const SmallCircularProgress = ({ size = 46, strokeWidth = 4, progress }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getProgressColor = (percent) => {
      if (percent >= 80) return "#10B981";
      if (percent >= 50) return "#F59E0B";
      return "#3B82F6";
    };

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-gray-700/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke={getProgressColor(progress)}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
          {progress}%
        </div>
      </div>
    );
  };

  // Questions for active topic
  const getQuestionsForTopic = (topic) => {
    if (!topic) return [];
    return questions.filter((q) => {
      const topicsArray = q.topics || (q.topic ? [q.topic] : []);
      return topicsArray.includes(topic);
    });
  };

  const activeTopicQuestions = getQuestionsForTopic(activeTopic);
  const activeTopicStats = activeTopic ? topicStats[activeTopic] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500/10 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      {/* background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

     <div className="relative px-6 py-8 md:px-12 lg:px-16 max-w-[1400px] mx-auto">

        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/progress")}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Sheets
          </button>

          <div className="text-right">
            <div className="text-xs text-gray-400">Sheet ID</div>
            <div className="text-[10px] font-mono text-gray-500">
              {sheetId?.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* MAIN GRID: LEFT (Sheet Progress) + RIGHT (Topic Progress) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN - Sheet Progress */}
          <div className="lg:col-span-2">
           <div className="glass-card p-8 md:p-10">

              <div className="flex flex-col xl:flex-row items-center xl:items-stretch justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Active Sheet
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
                    {sheet?.title}
                  </h1>

                  <p className="text-gray-300 mb-6 max-w-xl text-sm md:text-base">
                    {sheet?.description ||
                      "Pattern Wise Questions - Stop solving random DSA problems, start thinking in patterns."}
                  </p>

                  {/* stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="stat-card">
                      <div className="text-xs text-gray-400 mb-1">
                        Total Questions
                      </div>
                      <div className="text-xl font-bold">{totalQuestions}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        across all topics
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="text-xs text-gray-400 mb-1">Solved</div>
                      <div className="text-xl font-bold text-green-400">
                        {solvedQuestions}
                      </div>
                      <div className="text-[10px] text-green-500/70 mt-1">
                        great progress
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="text-xs text-gray-400 mb-1">
                        Active topics
                      </div>
                      <div className="text-xl font-bold text-blue-400">
                        {filteredTopics.length}
                      </div>
                      <div className="text-[10px] text-blue-500/70 mt-1">
                        with attempts
                      </div>
                    </div>
                  </div>
                </div>

                {/* big circle */}
                <div className="flex flex-col items-center justify-center">
                  <CircularProgress
                    size={170}
                    strokeWidth={12}
                    progress={percentage}
                    value={solvedQuestions}
                    total={totalQuestions}
                    label="solved"
                  />
                  <div className="mt-4 flex items-center gap-4 text-[11px] text-gray-300">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Solved</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span>Attempted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* overall bar */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex justify-between items-center mb-2 text-xs md:text-sm">
                  <span className="text-gray-300">Overall Progress</span>
                  <span className="font-semibold">{percentage}% Complete</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
                  <span>Start</span>
                  <span>Midway</span>
                  <span>Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Topic Progress */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold mb-1">Topic-wise Progress</h2>
                  <p className="text-gray-400 text-sm">
                    Click a topic to see its questions
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>{filteredTopics.length} Active Topics</span>
                  </div>
                </div>
              </div>

              {filteredTopics.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  Start solving questions to unlock topic-wise tracking.
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scroll pr-2">
                  {filteredTopics.map(([topic, data], index) => {
                    const percent =
                      data.total === 0
                        ? 0
                        : Math.round((data.solved / data.total) * 100);

                    return (
                      <div
                        key={topic}
                        onClick={() =>
                          setActiveTopic(
                            activeTopic === topic ? null : topic
                          )
                        }
                        className={`topic-card group cursor-pointer flex items-start justify-between gap-3 ${
                          activeTopic === topic
                            ? "ring-2 ring-blue-500/40 bg-white/10"
                            : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm md:text-base font-semibold truncate">
                              {topic}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full flex-shrink-0">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">
                            {data.total} questions total
                          </p>

                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                                <span>Solved</span>
                                <span>
                                  {data.solved}/{data.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700/30 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <SmallCircularProgress progress={percent} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Topic Questions Panel */}
        {activeTopic && activeTopicStats && (
          <div className="mt-6 animate-fadeIn">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="text-blue-400">{activeTopic}</span>
                    <span className="text-sm px-3 py-1 bg-blue-500/10 rounded-full">
                      {activeTopicStats.solved} solved
                    </span>
                  </h3>
                  <p className="text-gray-400 mt-1">
                    {activeTopicQuestions.length} questions in this topic
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTopic(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll pr-2">
                {activeTopicQuestions.map((question, index) => {
                  const progressRecord = progress.find(
                    p => (p.questionId?._id || p.questionId) === question._id
                  );
                  const isSolved = progressRecord?.isSolved === true;
                  const isAttempted = !!progressRecord;

                  return (
                    <div 
                      key={question._id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="text-lg font-mono text-gray-400 w-8">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <a 
                          href={question.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {question.title}
                        </a>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="text-xs text-gray-400">
                            {progressRecord?.lastAttempted 
                              ? `Last: ${new Date(progressRecord.lastAttempted).toLocaleDateString()}`
                              : 'Never attempted'
                            }
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 text-xs rounded-full ${
                        isSolved ? 'bg-green-500/20 text-green-400' :
                        isAttempted ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {isSolved ? 'Solved' : isAttempted ? 'Attempted' : 'Not Started'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        <div className="mt-6 text-center text-gray-500 text-[11px]">
          <p>Keep going! Every question solved takes you closer to mastery 🚀</p>
          <p className="mt-1">
            Next mini-milestone:{" "}
            {Math.ceil((solvedQuestions + 1) / 5) * 5} questions solved
          </p>
        </div>
      </div>

      {/* extra styles */}
      <style>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 20px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          padding: 12px;
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          background: rgba(15, 23, 42, 0.95);
          border-color: rgba(129, 140, 248, 0.4);
          transform: translateY(-1px);
        }

        .topic-card {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 14px 16px;
          transition: all 0.25s ease;
        }

        .topic-card:hover {
          background: rgba(15, 23, 42, 0.98);
          border-color: rgba(96, 165, 250, 0.6);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.7);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Hidden scrollbar but still scrollable */
        .custom-scroll {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        .custom-scroll::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default SheetProgress;