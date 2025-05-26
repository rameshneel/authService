// Generate a unique thread ID for email threading
export const generateThreadID = () => {
  return `CHAT_${Math.random().toString(36).substring(2, 15)}`;
};
