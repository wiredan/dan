const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const t = require("@babel/types");

// Files to scan
const files = [
  path.join(__dirname, "../src/store/authStore.ts"),
  path.join(__dirname, "../src/lib/api-client.ts"),
];

files.forEach((filePath) => {
  let code = fs.readFileSync(filePath, "utf8");
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const seenFunctions = new Map();
  const duplicates = [];

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (!name) return;

      const signature = generator(path.node).code;
      if (seenFunctions.has(name)) {
        const existing = seenFunctions.get(name);
        if (existing === signature) {
          duplicates.push(path);
        }
      } else {
        seenFunctions.set(name, signature);
      }
    },
  });

  // Remove duplicates
  duplicates.forEach((dup) => dup.remove());

  const output = generator(ast, {}, code).code;
  fs.writeFileSync(filePath, output, "utf8");

  console.log(`Processed ${filePath}, removed ${duplicates.length} duplicates`);
});
