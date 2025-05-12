import bcrypt from "bcryptjs";
export default {
  hash: async (password, saltRounds = 10) => {
    return await bcrypt.hash(password, saltRounds);
  },
  compare: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },
};
