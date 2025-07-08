# Plop Module Generator Documentation

Plop is a micro-generator framework that helps automate the creation of boilerplate code and files in your project.

## Usage

### 1. Run the Generator

From your project root, run:

```
npx plop module
```

### 2. Answer the Prompt

You will be asked for the module name (e.g., `user`, `auth`). Enter your desired module name.

### 3. Files Generated

Plop will create the following files and folders under `src/modules/{{kebabCase name}}`:

- `{{name}}.routes.ts` – Routes for the module
- `{{name}}.query.ts` – Query logic
- `{{name}}.controllers.ts` – Controllers
- `{{name}}.service.ts` – Service logic
- `types/{{name}}.input.ts` – Input types
- `types/{{name}}.queryRes.ts` – Query response types
- `types/{{name}}.respone.ts` – Response types

> All file names use kebab-case (e.g., `user-profile`).

### 4. Customization

You can edit the templates in `plopfile.js` to include more boilerplate or logic as needed.

## Example

If you enter `userProfile` as the module name, Plop will generate:

```
src/modules/user-profile/user-profile.routes.ts
src/modules/user-profile/user-profile.query.ts
src/modules/user-profile/user-profile.controllers.ts
src/modules/user-profile/user-profile.service.ts
src/modules/user-profile/types/user-profile.input.ts
src/modules/user-profile/types/user-profile.queryRes.ts
src/modules/user-profile/types/user-profile.respone.ts
```

## Troubleshooting

- Ensure `plopfile.js` is in the project root.
- Run `npx plop` from the root directory.
- If you get errors, try reinstalling Plop:
  ```
  npm uninstall plop node-plop && npm install --save-dev plop
  ```

## Code Generation

See [Plop Module Generator Documentation](./docs/plop.md) for instructions on using the code generator.
For more, see the [Plop documentation](https://plopjs.com/documentation/).
