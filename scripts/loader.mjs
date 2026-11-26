export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
      try {
        return await nextResolve(specifier + ".js", context);
      } catch {
        try {
          return await nextResolve(specifier + ".jsx", context);
        } catch {
          return await nextResolve(specifier + "/index.js", context);
        }
      }
    }
    throw err;
  }
}
