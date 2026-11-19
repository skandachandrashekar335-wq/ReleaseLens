module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies.jose) {
        pkg.dependencies.jose = "^4.15.9";
      }
      return pkg;
    }
  }
};
