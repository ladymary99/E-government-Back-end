const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Government Portal API",
      version: "1.0.0",
      description: "API for E-Government Citizen Services Portal",
      contact: {
        name: "API Support",
        email: "support@government.gov",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["citizen", "officer", "department_head", "admin"],
            },
            national_id: { type: "string" },
            dob: { type: "string", format: "date" },
            contact_info: { type: "object" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Department: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            is_active: { type: "boolean" },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            fee: { type: "number", format: "decimal" },
            department_id: { type: "string", format: "uuid" },
            is_active: { type: "boolean" },
          },
        },
        Request: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            service_id: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: [
                "submitted",
                "under_review",
                "approved",
                "rejected",
                "completed",
              ],
            },
            remarks: { type: "string" },
            form_data: { type: "object" },
            reference_number: { type: "string" },
            submitted_at: { type: "string", format: "date-time" },
            reviewed_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
