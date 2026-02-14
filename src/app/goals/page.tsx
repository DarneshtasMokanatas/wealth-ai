"use client";

import { useState, useCallback } from "react";
import { getGoals, addGoal, addContribution, deleteGoal } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Target, Trash2, DollarSign, X, Calendar } from "lucide-react";

export default function GoalsPage() {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const goals = getGoals();

  // Add Goal form state
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    emoji: "🎯",
    deadline: "",
  });

  const EMOJI_OPTIONS = ["🎯", "🗾", "💻", "🏦", "🚗", "🏠", "📱", "✈️", "🎓", "💎", "🎮", "🏋️"];

  function handleAddGoal() {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) return;
    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      emoji: newGoal.emoji,
      deadline: newGoal.deadline,
    });
    setNewGoal({ name: "", targetAmount: "", emoji: "🎯", deadline: "" });
    setShowAddModal(false);
    refresh();
  }

  function handleContribute() {
    if (!contributeGoalId || !contributionAmount) return;
    addContribution(contributeGoalId, parseFloat(contributionAmount));
    setContributeGoalId(null);
    setContributionAmount("");
    refresh();
  }

  function handleDeleteGoal(id: string) {
    deleteGoal(id);
    refresh();
  }

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fafafa",
              marginBottom: 4,
              letterSpacing: "-0.02em",
            }}
          >
            Savings Goals
          </h2>
          <p style={{ fontSize: 14, color: "#71717a" }}>
            Track your progress towards financial milestones.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid-3">
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>
            Active Goals
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fafafa" }}>
            {goals.length}
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>
            Total Target
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fafafa" }}>
            {formatCurrency(totalTarget)}
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>
            Total Saved
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
            {formatCurrency(totalSaved)}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="goals-grid">
        {goals.map((goal) => {
          const progress =
            goal.targetAmount > 0
              ? (goal.currentAmount / goal.targetAmount) * 100
              : 0;
          const remaining = goal.targetAmount - goal.currentAmount;
          const isComplete = progress >= 100;

          return (
            <div key={goal.id} className="glass-card" style={{ padding: 24 }}>
              {/* Goal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: isComplete
                        ? "linear-gradient(135deg, #10b981, #34d399)"
                        : "rgba(39, 39, 42, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      border: `1px solid ${
                        isComplete ? "rgba(16, 185, 129, 0.5)" : "#3f3f46"
                      }`,
                    }}
                  >
                    {goal.emoji}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#fafafa",
                        marginBottom: 2,
                      }}
                    >
                      {goal.name}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "#71717a",
                      }}
                    >
                      <Calendar size={12} />
                      {formatDate(goal.deadline)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    opacity: 0.4,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.4";
                  }}
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>

              {/* Amount */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, color: "#fafafa" }}>
                  {formatCurrency(goal.currentAmount)}
                </span>
                <span style={{ fontSize: 14, color: "#71717a" }}>
                  of {formatCurrency(goal.targetAmount)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isComplete ? "#10b981" : "#a1a1aa",
                  }}
                >
                  {isComplete ? "🎉 Goal Reached!" : `${progress.toFixed(1)}% complete`}
                </span>
                {!isComplete && (
                  <span style={{ fontSize: 12, color: "#71717a" }}>
                    {formatCurrency(remaining)} to go
                  </span>
                )}
              </div>

              {/* Add Contribution */}
              {!isComplete && (
                <>
                  {contributeGoalId === goal.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="number"
                        className="smart-input"
                        placeholder="Amount"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleContribute();
                        }}
                        style={{ padding: "8px 12px", fontSize: 13 }}
                        autoFocus
                      />
                      <button className="btn-primary" onClick={handleContribute} style={{ padding: "8px 14px" }}>
                        Save
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setContributeGoalId(null);
                          setContributionAmount("");
                        }}
                        style={{ padding: "8px 14px" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => setContributeGoalId(goal.id)}
                      style={{ width: "100%" }}
                    >
                      <DollarSign size={14} />
                      Add Contribution
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Target size={18} color="#10b981" />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fafafa" }}>
                  New Savings Goal
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={18} color="#71717a" />
              </button>
            </div>

            {/* Emoji Picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Choose an Icon
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewGoal({ ...newGoal, emoji })}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      border: `2px solid ${
                        newGoal.emoji === emoji ? "#10b981" : "#3f3f46"
                      }`,
                      background:
                        newGoal.emoji === emoji
                          ? "rgba(16, 185, 129, 0.1)"
                          : "transparent",
                      cursor: "pointer",
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Goal Name
              </label>
              <input
                type="text"
                className="smart-input"
                placeholder='e.g. "Japan Trip"'
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>

            {/* Target Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Target Amount ($)
              </label>
              <input
                type="number"
                className="smart-input"
                placeholder="3000"
                value={newGoal.targetAmount}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, targetAmount: e.target.value })
                }
              />
            </div>

            {/* Deadline */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Target Date
              </label>
              <input
                type="date"
                className="smart-input"
                value={newGoal.deadline}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, deadline: e.target.value })
                }
                style={{ colorScheme: "dark" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddGoal}
                disabled={!newGoal.name || !newGoal.targetAmount || !newGoal.deadline}
                style={{
                  flex: 1,
                  opacity:
                    newGoal.name && newGoal.targetAmount && newGoal.deadline
                      ? 1
                      : 0.4,
                }}
              >
                <Plus size={16} />
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
