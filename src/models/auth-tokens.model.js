// authService/src/models/auth-tokens.model.js
import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";
import { Op } from "sequelize";

const AuthToken = sequelize.define(
  "AuthToken",
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
        model: "users",
        key: "id",
      },
    },
    accessToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },

    refreshToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
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
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "auth_tokens",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      {
        fields: ["accessToken"],
        unique: true,
        where: { accessToken: { [Op.ne]: null } },
      },
      {
        fields: ["refreshToken"],
        unique: true,
        where: { refreshToken: { [Op.ne]: null } },
      },
    ],
  }
);

export default AuthToken;
