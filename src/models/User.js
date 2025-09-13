const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    role: {
      type: DataTypes.ENUM("citizen", "officer", "department_head", "admin"),
      allowNull: false,
      defaultValue: "citizen",
    },
    national_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        len: [10, 20],
      },
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    contact_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Department",
        key: "id",
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.refresh_token;
  return values;
};

// Class methods
User.findByEmail = function (email) {
  return this.findOne({ where: { email, is_active: true } });
};

User.findByNationalId = function (nationalId) {
  return this.findOne({ where: { national_id: nationalId, is_active: true } });
};

module.exports = User;
