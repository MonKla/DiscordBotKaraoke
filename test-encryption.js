
(async () => {
  console.log("Testing encryption libraries...");

  try {
    await import('sodium-native');
    console.log("✅ sodium-native imported successfully");
  } catch (e) {
    console.log("❌ sodium-native failed:", e);
  }

  try {
    await import('libsodium-wrappers');
    console.log("✅ libsodium-wrappers imported successfully");
  } catch (e) {
    console.log("❌ libsodium-wrappers failed:", e.message);
  }
})();
