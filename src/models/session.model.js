// authService/src/models/auth-tokens.model.js
import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";
import { Op } from "sequelize";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "auth_users",
        key: "id",
      },
    },
    refreshToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
      unique: true,
    },
    provider: {
      type: DataTypes.ENUM("google", "manual"),
      allowNull: false,
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rotatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sessionVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    mfaVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      {
        fields: ["refreshToken"],
        unique: true,
        where: { refreshToken: { [Op.ne]: null } },
      },
    ],
  }
);

export default Session;
