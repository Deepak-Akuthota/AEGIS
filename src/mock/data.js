export const mockMessages = [
  {
    id: "msg_1",
    sender: "Alex (Slack)",
    message: "Hey, can you review my PR when you have a chance?",
    timestamp: new Date().toISOString(),
    intent: "review_request",
    topic: "code review",
    keywords: ["review", "PR", "chance"],
    confidence: 0.88,
    urgency_score: 0.3,
    action: "blocked",
    auto_reply: null,
    reason: "Non-critical code review, can wait until end of session"
  },
  {
    id: "msg_2",
    sender: "Sarah (Discord)",
    message: "Lunch in 10?",
    timestamp: new Date().toISOString(),
    intent: "social",
    topic: "lunch",
    keywords: ["lunch", "10"],
    confidence: 0.95,
    urgency_score: 0.1,
    action: "auto_reply",
    auto_reply: "I'm currently in deep work. I'll get back to you later!",
    reason: "Social interaction, non-urgent"
  },
  {
    id: "msg_3",
    sender: "PagerDuty",
    message: "CRITICAL: Database CPU at 99% - production server down",
    timestamp: new Date().toISOString(),
    intent: "critical",
    topic: "infrastructure",
    keywords: ["CRITICAL", "Database", "CPU", "production", "down"],
    confidence: 0.99,
    urgency_score: 0.99,
    action: "alert",
    auto_reply: null,
    reason: "Infrastructure failure detected requiring immediate attention"
  },
  {
    id: "msg_4",
    sender: "Zomato",
    message: "50% off on your favorite meals today!",
    timestamp: new Date().toISOString(),
    intent: "promotional",
    topic: "offer in food delivery apps",
    keywords: ["50% off", "favorite meals", "today"],
    confidence: 0.92,
    urgency_score: 0.05,
    action: "blocked",
    auto_reply: null,
    reason: "Marketing content, lowest priority"
  },
  {
    id: "msg_5",
    sender: "Swiggy",
    message: "Hungry? Grab a bite with flat ₹150 off right now.",
    timestamp: new Date().toISOString(),
    intent: "promotional",
    topic: "offer in food delivery apps",
    keywords: ["Hungry", "₹150 off", "right now"],
    confidence: 0.94,
    urgency_score: 0.05,
    action: "blocked",
    auto_reply: null,
    reason: "Marketing content, lowest priority"
  },
  {
    id: "msg_6",
    sender: "Uber Eats",
    message: "Your weekend treat is here with a BOGO offer!",
    timestamp: new Date().toISOString(),
    intent: "promotional",
    topic: "offer in food delivery apps",
    keywords: ["weekend treat", "BOGO offer"],
    confidence: 0.91,
    urgency_score: 0.06,
    action: "blocked",
    auto_reply: null,
    reason: "Marketing content, lowest priority"
  }
];

export const generateMockMessage = () => {
  const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
  return {
    ...randomMsg,
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
};
