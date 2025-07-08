// plopfile.js
module.exports = function (plop) {
  plop.setGenerator("module", {
    description: "Generate a module with routes, controllers, etc.",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Module name (e.g., user, auth)",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/{{kebabCase name}}.routes.ts",
        template: "// Routes for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/{{kebabCase name}}.query.ts",
        template: "// Queries for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/{{kebabCase name}}.controllers.ts",
        template: "// Controllers for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/{{kebabCase name}}.service.ts",
        template: "// Service logic for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/types/{{kebabCase name}}.input.ts",
        template: "// Input types for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/types/{{kebabCase name}}.queryRes.ts",
        template: "// Query response types for {{name}} module",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase name}}/types/{{kebabCase name}}.respone.ts",
        template: "// Response types for {{name}} module",
      },
    ],
  });
};
